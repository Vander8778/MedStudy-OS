mod commands;
mod config;
mod session_context;
mod system;
mod telemetry;

use std::sync::Arc;

use tauri::Manager;

use crate::{
    commands::DesktopCommandState,
    config::DesktopConfig,
    session_context::SessionContextStore,
    system::tray,
    telemetry::TelemetryRuntime,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            let config = DesktopConfig::load();
            let session_context_store =
                SessionContextStore::new(app_handle.clone(), "session-context.json")?;
            let telemetry_runtime =
                TelemetryRuntime::new(app_handle.clone(), config.clone(), session_context_store.clone())?;
            let command_state = DesktopCommandState::new(
                config,
                session_context_store,
                telemetry_runtime,
            );

            app.manage(Arc::new(command_state));
            tray::install(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_desktop_config,
            commands::login_stub,
            commands::get_persisted_session_context,
            commands::persist_session_context,
            commands::clear_persisted_session_context,
            commands::start_telemetry_capture,
            commands::stop_telemetry_capture,
            commands::get_telemetry_status,
            commands::get_buffer_health,
            commands::force_flush_telemetry,
            commands::get_active_window_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
