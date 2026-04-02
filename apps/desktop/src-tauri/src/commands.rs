use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::{
    config::DesktopConfig,
    session_context::{now_iso_string, PersistedSessionContext, SessionContextStore},
    telemetry::{ActiveSessionContext, BufferHealth, TelemetryRuntime, TelemetryStatus},
};

pub struct DesktopCommandState {
    config: DesktopConfig,
    session_context_store: SessionContextStore,
    telemetry_runtime: TelemetryRuntime,
}

impl DesktopCommandState {
    pub fn new(
        config: DesktopConfig,
        session_context_store: SessionContextStore,
        telemetry_runtime: TelemetryRuntime,
    ) -> Self {
        Self {
            config,
            session_context_store,
            telemetry_runtime,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginStubResponse {
    pub token: String,
    pub user: LoginStubUser,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginStubUser {
    pub id: String,
    pub email: String,
    pub role: String,
}

#[tauri::command]
pub fn get_desktop_config(state: State<'_, Arc<DesktopCommandState>>) -> DesktopConfig {
    state.config.clone()
}

#[tauri::command]
pub fn login_stub(email: String) -> LoginStubResponse {
    let sanitized = email.replace(|character: char| !character.is_ascii_alphanumeric(), "_");
    let user_id = format!(
        "user_{}",
        if sanitized.is_empty() {
            Uuid::new_v4().to_string()
        } else {
            sanitized
        }
    );

    LoginStubResponse {
        token: format!("stub-token:{user_id}"),
        user: LoginStubUser {
            id: user_id,
            email,
            role: "student".to_string(),
        },
    }
}

#[tauri::command]
pub fn get_persisted_session_context(
    state: State<'_, Arc<DesktopCommandState>>,
) -> Option<PersistedSessionContext> {
    state.session_context_store.load()
}

#[tauri::command]
pub fn persist_session_context(
    session_id: String,
    user_id: String,
    state: State<'_, Arc<DesktopCommandState>>,
) -> Result<(), String> {
    state
        .session_context_store
        .persist(&PersistedSessionContext {
            session_id,
            user_id,
            persisted_at: now_iso_string(),
        })
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn clear_persisted_session_context(
    state: State<'_, Arc<DesktopCommandState>>,
) -> Result<(), String> {
    state
        .session_context_store
        .clear()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn start_telemetry_capture(
    session_id: String,
    user_id: String,
    state: State<'_, Arc<DesktopCommandState>>,
) -> Result<TelemetryStatus, String> {
    state
        .telemetry_runtime
        .start_capture(ActiveSessionContext { session_id, user_id })
        .map_err(|error| error.to_string())?;
    Ok(state.telemetry_runtime.get_status())
}

#[tauri::command]
pub fn stop_telemetry_capture(
    state: State<'_, Arc<DesktopCommandState>>,
) -> Result<TelemetryStatus, String> {
    state
        .telemetry_runtime
        .stop_capture()
        .map_err(|error| error.to_string())?;
    Ok(state.telemetry_runtime.get_status())
}

#[tauri::command]
pub fn get_telemetry_status(
    state: State<'_, Arc<DesktopCommandState>>,
) -> TelemetryStatus {
    state.telemetry_runtime.get_status()
}

#[tauri::command]
pub fn get_buffer_health(
    state: State<'_, Arc<DesktopCommandState>>,
) -> Result<BufferHealth, String> {
    state
        .telemetry_runtime
        .get_buffer_health()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn force_flush_telemetry(
    state: State<'_, Arc<DesktopCommandState>>,
) -> Result<TelemetryStatus, String> {
    state
        .telemetry_runtime
        .force_flush()
        .map_err(|error| error.to_string())?;
    Ok(state.telemetry_runtime.get_status())
}

#[tauri::command]
pub fn get_active_window_info(
    state: State<'_, Arc<DesktopCommandState>>,
) -> crate::system::window_tracker::ActiveWindowInfo {
    state.telemetry_runtime.get_active_window_info()
}
