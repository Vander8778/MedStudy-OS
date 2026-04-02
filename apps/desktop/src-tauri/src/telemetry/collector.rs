use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use serde::{Deserialize, Serialize};
use tokio::time::sleep;
use uuid::Uuid;

use crate::{
    config::DesktopConfig,
    session_context::now_iso_string,
    system::{
        idle_detector::{IdleDetector, IdleSnapshot},
        window_tracker::{ActiveWindowInfo, WindowTracker},
    },
};

use super::{
    buffer::{BufferedTelemetryEvent, TelemetryBuffer},
    ActiveSessionContext, TelemetryCaptureMode, TelemetryStatus,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum InputActivityLevel {
    None,
    Minimal,
    Normal,
}

#[derive(Debug, Clone, PartialEq)]
struct CollectorSnapshot {
    active_window: ActiveWindowInfo,
    input_activity: InputActivityLevel,
    idle: bool,
}

#[derive(Clone)]
pub struct TelemetryCollector {
    config: DesktopConfig,
    buffer: TelemetryBuffer,
    window_tracker: Arc<WindowTracker>,
    idle_detector: Arc<IdleDetector>,
}

impl TelemetryCollector {
    pub fn new(
        config: DesktopConfig,
        buffer: TelemetryBuffer,
        window_tracker: Arc<WindowTracker>,
        idle_detector: Arc<IdleDetector>,
    ) -> Self {
        Self {
            config,
            buffer,
            window_tracker,
            idle_detector,
        }
    }

    pub fn spawn(
        &self,
        status: Arc<Mutex<TelemetryStatus>>,
        active_session: Arc<Mutex<Option<ActiveSessionContext>>>,
    ) {
        let collector = self.clone();
        tauri::async_runtime::spawn(async move {
            let mut last_snapshot: Option<CollectorSnapshot> = None;
            let mut last_heartbeat_at = std::time::Instant::now()
                .checked_sub(Duration::from_millis(collector.config.heartbeat_interval_ms))
                .unwrap_or_else(std::time::Instant::now);

            loop {
                let active_context = active_session
                    .lock()
                    .expect("active session lock poisoned")
                    .clone();

                if let Some(context) = active_context {
                    let now = std::time::Instant::now();
                    if now.duration_since(last_heartbeat_at)
                        >= Duration::from_millis(collector.config.heartbeat_interval_ms)
                    {
                        let _ = collector.buffer.insert(&collector.build_event(
                            &context,
                            "heartbeat",
                            serde_json::json!({ "source": "collector" }),
                        ));
                        last_heartbeat_at = now;
                    }

                    if context.capture_mode == TelemetryCaptureMode::HeartbeatOnly {
                        last_snapshot = None;

                        if let Ok(health) = collector.buffer.health() {
                            let mut telemetry_status = status.lock().expect("status lock poisoned");
                            telemetry_status.capturing = true;
                            telemetry_status.active_session_id = Some(context.session_id);
                            telemetry_status.active_user_id = Some(context.user_id);
                            telemetry_status.queued_events = health.pending_events;
                            telemetry_status.retained_uploaded_events =
                                health.retained_uploaded_events;
                            telemetry_status.queue_warning = health.queue_warning;
                        }

                        sleep(Duration::from_millis(
                            collector.config.window_track_interval_ms,
                        ))
                        .await;
                        continue;
                    }

                    let active_window = collector.window_tracker.capture(&collector.config);
                    let idle_snapshot = collector
                        .idle_detector
                        .capture(collector.config.idle_threshold_seconds);
                    let input_activity = map_input_activity(&idle_snapshot, &collector.config);
                    let snapshot = CollectorSnapshot {
                        active_window: active_window.clone(),
                        input_activity: input_activity.clone(),
                        idle: idle_snapshot.is_idle,
                    };
                    let event_types = collect_snapshot_event_types(
                        last_snapshot.as_ref(),
                        &snapshot,
                        collector.config.enable_input_activity_capture,
                    );

                    if event_types.contains(&"window_changed") {
                        let _ = collector.buffer.insert(&collector.build_event(
                            &context,
                            "window_changed",
                            serde_json::json!({
                                "focused": active_window.focused,
                                "title": active_window.title,
                                "processName": active_window.process_name,
                            }),
                        ));
                    }

                    if event_types.contains(&"focus_changed") {
                        let _ = collector.buffer.insert(&collector.build_event(
                            &context,
                            "focus_changed",
                            serde_json::json!({ "focused": active_window.focused }),
                        ));
                    }

                    if event_types.contains(&"input_activity") {
                        let _ = collector.buffer.insert(&collector.build_event(
                            &context,
                            "input_activity",
                            serde_json::json!({ "level": input_activity }),
                        ));
                    }

                    if event_types.contains(&"idle_detected") {
                        let _ = collector.buffer.insert(&collector.build_event(
                            &context,
                            "idle_detected",
                            serde_json::json!({
                                "idle": true,
                                "idleSeconds": idle_snapshot.idle_seconds,
                            }),
                        ));
                    }

                    last_snapshot = Some(snapshot);

                    if let Ok(health) = collector.buffer.health() {
                        let mut telemetry_status = status.lock().expect("status lock poisoned");
                        telemetry_status.capturing = true;
                        telemetry_status.active_session_id = Some(context.session_id);
                        telemetry_status.active_user_id = Some(context.user_id);
                        telemetry_status.queued_events = health.pending_events;
                        telemetry_status.retained_uploaded_events = health.retained_uploaded_events;
                        telemetry_status.queue_warning = health.queue_warning;
                    }
                } else {
                    last_snapshot = None;
                    let mut telemetry_status = status.lock().expect("status lock poisoned");
                    telemetry_status.capturing = false;
                    telemetry_status.active_session_id = None;
                    telemetry_status.active_user_id = None;
                }

                sleep(Duration::from_millis(
                    collector.config.window_track_interval_ms,
                ))
                .await;
            }
        });
    }

    pub fn get_active_window_info(&self) -> ActiveWindowInfo {
        self.window_tracker.capture(&self.config)
    }

    fn build_event(
        &self,
        context: &ActiveSessionContext,
        event_type: &str,
        payload: serde_json::Value,
    ) -> BufferedTelemetryEvent {
        let occurred_at = now_iso_string();
        BufferedTelemetryEvent {
            client_event_id: Uuid::new_v4().to_string(),
            session_id: context.session_id.clone(),
            user_id: context.user_id.clone(),
            event_type: event_type.to_string(),
            occurred_at: occurred_at.clone(),
            payload,
            created_at: occurred_at,
            uploaded_at: None,
            upload_attempts: 0,
        }
    }
}

fn map_input_activity(
    idle_snapshot: &IdleSnapshot,
    config: &DesktopConfig,
) -> InputActivityLevel {
    if idle_snapshot.idle_seconds >= config.idle_threshold_seconds {
        InputActivityLevel::None
    } else if idle_snapshot.idle_seconds >= (config.idle_threshold_seconds / 3).max(10) {
        InputActivityLevel::Minimal
    } else {
        InputActivityLevel::Normal
    }
}

fn collect_snapshot_event_types(
    previous: Option<&CollectorSnapshot>,
    next: &CollectorSnapshot,
    include_input_activity: bool,
) -> Vec<&'static str> {
    let mut event_types = Vec::new();

    if previous
        .map(|snapshot| snapshot.active_window != next.active_window)
        .unwrap_or(true)
    {
        event_types.push("window_changed");
    }

    if previous
        .map(|snapshot| snapshot.active_window.focused != next.active_window.focused)
        .unwrap_or(true)
    {
        event_types.push("focus_changed");
    }

    if include_input_activity
        && previous
            .map(|snapshot| snapshot.input_activity != next.input_activity)
            .unwrap_or(true)
    {
        event_types.push("input_activity");
    }

    if next.idle && previous.map(|snapshot| !snapshot.idle).unwrap_or(true) {
        event_types.push("idle_detected");
    }

    event_types
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn heartbeat_and_idle_levels_are_mapped_without_keystroke_content() {
        let config = DesktopConfig::default();
        assert_eq!(
            map_input_activity(
                &IdleSnapshot {
                    idle_seconds: config.idle_threshold_seconds,
                    is_idle: true,
                },
                &config
            ),
            InputActivityLevel::None
        );
        assert_eq!(
            map_input_activity(
                &IdleSnapshot {
                    idle_seconds: 45,
                    is_idle: false,
                },
                &config
            ),
            InputActivityLevel::Minimal
        );
        assert_eq!(
            map_input_activity(
                &IdleSnapshot {
                    idle_seconds: 1,
                    is_idle: false,
                },
                &config
            ),
            InputActivityLevel::Normal
        );
    }

    #[test]
    fn restarting_after_snapshot_reset_emits_fresh_initial_events() {
        let snapshot = CollectorSnapshot {
            active_window: ActiveWindowInfo {
                title: Some("Study Notes".to_string()),
                process_name: Some("notepad.exe".to_string()),
                focused: true,
            },
            input_activity: InputActivityLevel::Normal,
            idle: false,
        };

        let initial_events = collect_snapshot_event_types(None, &snapshot, true);
        let resumed_events = collect_snapshot_event_types(None, &snapshot, true);

        assert_eq!(
            initial_events,
            vec!["window_changed", "focus_changed", "input_activity"]
        );
        assert_eq!(resumed_events, initial_events);
    }

    #[test]
    fn unchanged_snapshots_do_not_emit_duplicate_events() {
        let snapshot = CollectorSnapshot {
            active_window: ActiveWindowInfo {
                title: Some("Study Notes".to_string()),
                process_name: Some("notepad.exe".to_string()),
                focused: true,
            },
            input_activity: InputActivityLevel::Normal,
            idle: false,
        };

        assert!(collect_snapshot_event_types(Some(&snapshot), &snapshot, true).is_empty());
    }
}
