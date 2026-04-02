pub mod buffer;
pub mod collector;
pub mod uploader;

use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::{
    config::DesktopConfig,
    session_context::SessionContextStore,
    system::{
        idle_detector::IdleDetector,
        window_tracker::{ActiveWindowInfo, WindowTracker},
    },
};

use self::{
    buffer::{BufferedTelemetryEvent, TelemetryBuffer},
    collector::TelemetryCollector,
    uploader::TelemetryUploader,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveSessionContext {
    pub session_id: String,
    pub user_id: String,
    pub capture_mode: TelemetryCaptureMode,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TelemetryCaptureMode {
    Full,
    HeartbeatOnly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryStatus {
    pub capturing: bool,
    pub active_session_id: Option<String>,
    pub active_user_id: Option<String>,
    pub queued_events: usize,
    pub retained_uploaded_events: usize,
    pub last_flush_at: Option<String>,
    pub consecutive_failure_count: u32,
    pub next_retry_in_ms: u64,
    pub queue_warning: bool,
    pub last_error: Option<String>,
}

impl Default for TelemetryStatus {
    fn default() -> Self {
        Self {
            capturing: false,
            active_session_id: None,
            active_user_id: None,
            queued_events: 0,
            retained_uploaded_events: 0,
            last_flush_at: None,
            consecutive_failure_count: 0,
            next_retry_in_ms: 0,
            queue_warning: false,
            last_error: None,
        }
    }
}

#[derive(Clone)]
pub struct TelemetryRuntime {
    inner: Arc<TelemetryRuntimeInner>,
}

struct TelemetryRuntimeInner {
    buffer: TelemetryBuffer,
    status: Arc<Mutex<TelemetryStatus>>,
    active_session: Arc<Mutex<Option<ActiveSessionContext>>>,
    collector_started: Mutex<bool>,
    uploader_started: Mutex<bool>,
    collector: TelemetryCollector,
    uploader: TelemetryUploader,
}

impl TelemetryRuntime {
    pub fn new(
        app_handle: AppHandle,
        config: DesktopConfig,
        session_context_store: SessionContextStore,
    ) -> tauri::Result<Self> {
        let mut buffer_path = resolve_app_data_path(&app_handle)?;
        buffer_path.push("telemetry-buffer.sqlite3");
        let buffer = TelemetryBuffer::new(
            buffer_path,
            config.telemetry_buffer_max_events,
            config.uploaded_retention_seconds,
        )?;
        let collector = TelemetryCollector::new(
            config.clone(),
            buffer.clone(),
            Arc::new(WindowTracker::default()),
            Arc::new(IdleDetector::default()),
        );
        let uploader = TelemetryUploader::new(config, buffer.clone(), session_context_store)
            .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;

        Ok(Self {
            inner: Arc::new(TelemetryRuntimeInner {
                buffer,
                status: Arc::new(Mutex::new(TelemetryStatus::default())),
                active_session: Arc::new(Mutex::new(None)),
                collector_started: Mutex::new(false),
                uploader_started: Mutex::new(false),
                collector,
                uploader,
            }),
        })
    }

    pub fn start_capture(&self, session: ActiveSessionContext) -> anyhow::Result<()> {
        {
            let mut active_session = self
                .inner
                .active_session
                .lock()
                .expect("active session lock poisoned");
            *active_session = Some(session.clone());
        }

        self.ensure_background_tasks_started();

        let health = self.inner.buffer.health()?;
        let mut status = self.inner.status.lock().expect("status lock poisoned");
        status.capturing = true;
        status.active_session_id = Some(session.session_id);
        status.active_user_id = Some(session.user_id);
        status.queued_events = health.pending_events;
        status.retained_uploaded_events = health.retained_uploaded_events;
        status.queue_warning = health.queue_warning;
        Ok(())
    }

    pub fn stop_capture(&self) -> anyhow::Result<()> {
        {
            let mut active_session = self
                .inner
                .active_session
                .lock()
                .expect("active session lock poisoned");
            *active_session = None;
        }

        let health = self.inner.buffer.health()?;
        let mut status = self.inner.status.lock().expect("status lock poisoned");
        status.capturing = false;
        status.active_session_id = None;
        status.active_user_id = None;
        status.queued_events = health.pending_events;
        status.retained_uploaded_events = health.retained_uploaded_events;
        status.queue_warning = health.queue_warning;
        Ok(())
    }

    pub fn get_status(&self) -> TelemetryStatus {
        let mut status = self.inner.status.lock().expect("status lock poisoned").clone();
        if let Ok(health) = self.inner.buffer.health() {
            status.queued_events = health.pending_events;
            status.retained_uploaded_events = health.retained_uploaded_events;
            status.queue_warning = health.queue_warning;
        }
        status
    }

    pub fn get_buffer_health(&self) -> anyhow::Result<BufferHealth> {
        self.inner.buffer.health()
    }

    pub async fn force_flush(&self) -> anyhow::Result<()> {
        self.ensure_background_tasks_started();
        self.inner
            .uploader
            .flush_now(&self.inner.status, &self.inner.active_session)
            .await
    }

    pub fn get_active_window_info(&self) -> ActiveWindowInfo {
        self.inner.collector.get_active_window_info()
    }

    fn ensure_background_tasks_started(&self) {
        {
            let mut started = self
                .inner
                .collector_started
                .lock()
                .expect("collector flag lock poisoned");
            if !*started {
                self.inner.collector.spawn(
                    self.inner.status.clone(),
                    self.inner.active_session.clone(),
                );
                *started = true;
            }
        }

        {
            let mut started = self
                .inner
                .uploader_started
                .lock()
                .expect("uploader flag lock poisoned");
            if !*started {
                self.inner.uploader.spawn(
                    self.inner.status.clone(),
                    self.inner.active_session.clone(),
                );
                *started = true;
            }
        }
    }
}

fn resolve_app_data_path(app_handle: &AppHandle) -> tauri::Result<PathBuf> {
    let base = app_handle
        .path()
        .app_data_dir()
        .map_err(|error: tauri::Error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
    std::fs::create_dir_all(&base)
        .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
    Ok(base)
}

pub use buffer::BufferHealth;
pub use collector::InputActivityLevel;

pub fn map_buffered_events_to_batch(events: &[BufferedTelemetryEvent]) -> serde_json::Value {
    serde_json::json!({
        "events": events.iter().map(|event| event.to_batch_payload()).collect::<Vec<_>>()
    })
}
