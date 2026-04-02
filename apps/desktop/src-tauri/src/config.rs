use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DesktopConfig {
    pub backend_url: String,
    pub poll_interval_ms: u64,
    pub telemetry_flush_interval_ms: u64,
    pub telemetry_buffer_max_events: usize,
    pub heartbeat_interval_ms: u64,
    pub window_track_interval_ms: u64,
    pub idle_threshold_seconds: u64,
    pub uploaded_retention_seconds: u64,
    pub enable_window_title_capture: bool,
    pub enable_process_name_capture: bool,
    pub enable_input_activity_capture: bool,
}

impl Default for DesktopConfig {
    fn default() -> Self {
        Self {
            backend_url: std::env::var("MEDSTUDY_BACKEND_URL")
                .unwrap_or_else(|_| "http://127.0.0.1:3000/api".to_string()),
            poll_interval_ms: 5_000,
            telemetry_flush_interval_ms: 10_000,
            telemetry_buffer_max_events: 10_000,
            heartbeat_interval_ms: 30_000,
            window_track_interval_ms: 5_000,
            idle_threshold_seconds: 120,
            uploaded_retention_seconds: 900,
            enable_window_title_capture: true,
            enable_process_name_capture: true,
            enable_input_activity_capture: true,
        }
    }
}

impl DesktopConfig {
    pub fn load() -> Self {
        Self::default()
    }
}
