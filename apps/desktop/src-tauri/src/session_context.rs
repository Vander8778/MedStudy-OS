use std::{
    fs,
    path::PathBuf,
    sync::{Arc, Mutex},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PersistedSessionContext {
    pub session_id: String,
    pub user_id: String,
    pub persisted_at: String,
}

#[derive(Clone)]
pub struct SessionContextStore {
    file_path: PathBuf,
    lock: Arc<Mutex<()>>,
}

impl SessionContextStore {
    pub fn new(app_handle: AppHandle, file_name: &str) -> tauri::Result<Self> {
        let mut base_path = app_handle
            .path()
            .app_data_dir()
            .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
        fs::create_dir_all(&base_path)
            .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
        base_path.push(file_name);

        Ok(Self {
            file_path: base_path,
            lock: Arc::new(Mutex::new(())),
        })
    }

    pub fn load(&self) -> Option<PersistedSessionContext> {
        let _guard = self.lock.lock().expect("session context lock poisoned");
        let raw = fs::read_to_string(&self.file_path).ok()?;
        serde_json::from_str(&raw).ok()
    }

    pub fn persist(&self, context: &PersistedSessionContext) -> tauri::Result<()> {
        let _guard = self.lock.lock().expect("session context lock poisoned");
        let parent = self
            .file_path
            .parent()
            .ok_or_else(|| tauri::Error::Anyhow(anyhow::anyhow!("missing app data directory")))?;
        fs::create_dir_all(parent)
            .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
        let temp_path = self.file_path.with_extension("tmp");
        let payload = serde_json::to_vec_pretty(context)
            .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
        fs::write(&temp_path, payload)
            .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
        fs::rename(&temp_path, &self.file_path)
            .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
        Ok(())
    }

    pub fn clear(&self) -> tauri::Result<()> {
        let _guard = self.lock.lock().expect("session context lock poisoned");
        if self.file_path.exists() {
            fs::remove_file(&self.file_path)
                .map_err(|error| tauri::Error::Anyhow(anyhow::anyhow!(error.to_string())))?;
        }

        Ok(())
    }
}

pub fn now_iso_string() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}
