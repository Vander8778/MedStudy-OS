use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use serde::{Deserialize, Serialize};

use crate::{config::DesktopConfig, session_context::{now_iso_string, SessionContextStore}};

use super::{
    buffer::{BufferedTelemetryEvent, TelemetryBuffer},
    map_buffered_events_to_batch, ActiveSessionContext, TelemetryStatus,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UploadOutcome {
    pub uploaded_count: usize,
    pub discarded_count: usize,
    pub retried_count: usize,
}

#[derive(Clone)]
pub struct TelemetryUploader {
    config: DesktopConfig,
    buffer: TelemetryBuffer,
    client: reqwest::Client,
    session_context_store: SessionContextStore,
}

impl TelemetryUploader {
    pub fn new(
        config: DesktopConfig,
        buffer: TelemetryBuffer,
        session_context_store: SessionContextStore,
    ) -> anyhow::Result<Self> {
        let client = reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(5))
            .timeout(Duration::from_secs(15))
            .build()?;

        Ok(Self {
            config,
            buffer,
            client,
            session_context_store,
        })
    }

    pub fn spawn(
        &self,
        status: Arc<Mutex<TelemetryStatus>>,
        active_session: Arc<Mutex<Option<ActiveSessionContext>>>,
    ) {
        let uploader = self.clone();
        tauri::async_runtime::spawn(async move {
            let mut current_backoff_ms = uploader.config.telemetry_flush_interval_ms;

            loop {
                tauri::async_runtime::sleep(Duration::from_millis(current_backoff_ms)).await;

                match uploader.flush_now(&status, &active_session).await {
                    Ok(_) => {
                        current_backoff_ms = uploader.config.telemetry_flush_interval_ms;
                    }
                    Err(error) => {
                        let mut telemetry_status = status.lock().expect("status lock poisoned");
                        telemetry_status.last_error = Some(error.to_string());
                        telemetry_status.consecutive_failure_count += 1;
                        current_backoff_ms = next_backoff_ms(
                            current_backoff_ms,
                            uploader.config.telemetry_flush_interval_ms,
                        );
                        telemetry_status.next_retry_in_ms = current_backoff_ms;
                    }
                }
            }
        });
    }

    pub async fn flush_now(
        &self,
        status: &Arc<Mutex<TelemetryStatus>>,
        _active_session: &Arc<Mutex<Option<ActiveSessionContext>>>,
    ) -> anyhow::Result<()> {
        let batch = self.buffer.pending_batch(50)?;
        if batch.is_empty() {
            let mut telemetry_status = status.lock().expect("status lock poisoned");
            telemetry_status.next_retry_in_ms = self.config.telemetry_flush_interval_ms;
            return Ok(());
        }

        let response = self
            .client
            .post(format!(
                "{}/telemetry/events/batch",
                self.config.backend_url.trim_end_matches('/')
            ))
            .json(&map_buffered_events_to_batch(&batch))
            .send()
            .await;

        match response {
            Ok(http_response) if http_response.status().is_success() => {
                let body: serde_json::Value = http_response.json().await?;
                let results = body
                    .get("results")
                    .and_then(|value| value.as_array())
                    .cloned()
                    .unwrap_or_default();
                let terminal_ids = collect_terminal_ids(&batch, &results);
                self.buffer.mark_uploaded(&terminal_ids, &now_iso_string())?;

                let mut telemetry_status = status.lock().expect("status lock poisoned");
                telemetry_status.last_error = None;
                telemetry_status.last_flush_at = Some(now_iso_string());
                telemetry_status.consecutive_failure_count = 0;
                telemetry_status.next_retry_in_ms = self.config.telemetry_flush_interval_ms;
            }
            Ok(http_response) if http_response.status().is_client_error() => {
                let client_event_ids = batch
                    .iter()
                    .map(|event| event.client_event_id.clone())
                    .collect::<Vec<_>>();
                self.buffer.increment_attempts(&client_event_ids)?;
                self.buffer.mark_uploaded(&client_event_ids, &now_iso_string())?;

                let mut telemetry_status = status.lock().expect("status lock poisoned");
                telemetry_status.last_error = Some(format!(
                    "Telemetry batch rejected with status {}.",
                    http_response.status()
                ));
                telemetry_status.last_flush_at = Some(now_iso_string());
                telemetry_status.next_retry_in_ms = self.config.telemetry_flush_interval_ms;
            }
            Ok(http_response) => {
                let client_event_ids = batch
                    .iter()
                    .map(|event| event.client_event_id.clone())
                    .collect::<Vec<_>>();
                self.buffer.increment_attempts(&client_event_ids)?;
                anyhow::bail!("Telemetry batch failed with status {}.", http_response.status());
            }
            Err(error) => {
                let client_event_ids = batch
                    .iter()
                    .map(|event| event.client_event_id.clone())
                    .collect::<Vec<_>>();
                self.buffer.increment_attempts(&client_event_ids)?;
                anyhow::bail!("Telemetry batch upload failed: {error}");
            }
        }

        let health = self.buffer.health()?;
        let mut telemetry_status = status.lock().expect("status lock poisoned");
        telemetry_status.queued_events = health.pending_events;
        telemetry_status.retained_uploaded_events = health.retained_uploaded_events;
        telemetry_status.queue_warning = health.queue_warning;
        if let Some(context) = self.session_context_store.load() {
            telemetry_status.active_session_id = Some(context.session_id);
            telemetry_status.active_user_id = Some(context.user_id);
        }

        Ok(())
    }
}

fn collect_terminal_ids(
    batch: &[BufferedTelemetryEvent],
    results: &[serde_json::Value],
) -> Vec<String> {
    if results.is_empty() {
        return batch
            .iter()
            .map(|event| event.client_event_id.clone())
            .collect();
    }

    let mut terminal_ids = Vec::new();

    for event in batch {
        if let Some(result) = results.iter().find(|result| {
            result
                .get("clientEventId")
                .and_then(|value| value.as_str())
                == Some(event.client_event_id.as_str())
        }) {
            if result
                .get("accepted")
                .and_then(|value| value.as_bool())
                .unwrap_or(false)
                || result.get("error").is_some()
            {
                terminal_ids.push(event.client_event_id.clone());
            }
        }
    }

    terminal_ids
}

fn next_backoff_ms(current_backoff_ms: u64, base_backoff_ms: u64) -> u64 {
    (current_backoff_ms * 2).min(base_backoff_ms * 12)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn event(id: &str) -> BufferedTelemetryEvent {
        BufferedTelemetryEvent {
            client_event_id: id.to_string(),
            session_id: "session_1".to_string(),
            user_id: "user_1".to_string(),
            event_type: "heartbeat".to_string(),
            occurred_at: "2026-04-02T10:00:00.000Z".to_string(),
            payload: serde_json::json!({}),
            created_at: "2026-04-02T10:00:00.000Z".to_string(),
            uploaded_at: None,
            upload_attempts: 0,
        }
    }

    #[test]
    fn collects_terminal_ids_for_success_and_rejected_results() {
        let ids = collect_terminal_ids(
            &[event("one"), event("two"), event("three")],
            &[
                serde_json::json!({ "clientEventId": "one", "accepted": true }),
                serde_json::json!({ "clientEventId": "two", "accepted": false, "error": "duplicate" }),
            ],
        );

        assert_eq!(ids, vec!["one".to_string(), "two".to_string()]);
    }

    #[test]
    fn treats_empty_results_as_full_acceptance_for_successful_batches() {
        let ids = collect_terminal_ids(&[event("one"), event("two")], &[]);

        assert_eq!(ids, vec!["one".to_string(), "two".to_string()]);
    }

    #[test]
    fn doubles_backoff_until_the_cap() {
        assert_eq!(next_backoff_ms(10_000, 10_000), 20_000);
        assert_eq!(next_backoff_ms(20_000, 10_000), 40_000);
        assert_eq!(next_backoff_ms(80_000, 10_000), 120_000);
        assert_eq!(next_backoff_ms(120_000, 10_000), 120_000);
    }
}
