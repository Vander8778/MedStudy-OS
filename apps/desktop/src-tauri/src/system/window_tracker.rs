use serde::{Deserialize, Serialize};

use crate::config::DesktopConfig;

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ActiveWindowInfo {
    pub title: Option<String>,
    pub process_name: Option<String>,
    pub focused: bool,
}

#[derive(Clone, Default)]
pub struct WindowTracker;

impl WindowTracker {
    pub fn capture(&self, config: &DesktopConfig) -> ActiveWindowInfo {
        platform::capture_active_window(config)
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use super::ActiveWindowInfo;
    use crate::config::DesktopConfig;
    use windows_sys::Win32::{
        Foundation::{CloseHandle, HWND},
        System::{
            ProcessStatus::K32GetModuleBaseNameW,
            Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ},
        },
        UI::WindowsAndMessaging::{
            GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW,
            GetWindowThreadProcessId,
        },
    };

    pub fn capture_active_window(config: &DesktopConfig) -> ActiveWindowInfo {
        unsafe {
            let window = GetForegroundWindow();
            if window == 0 {
                return ActiveWindowInfo::default();
            }

            let title = if config.enable_window_title_capture {
                read_window_title(window)
            } else {
                None
            };
            let process_name = if config.enable_process_name_capture {
                read_process_name(window)
            } else {
                None
            };

            ActiveWindowInfo {
                title,
                process_name,
                focused: true,
            }
        }
    }

    unsafe fn read_window_title(window: HWND) -> Option<String> {
        let title_length = GetWindowTextLengthW(window);
        if title_length <= 0 {
            return None;
        }

        let mut buffer = vec![0_u16; title_length as usize + 1];
        let copied = GetWindowTextW(window, buffer.as_mut_ptr(), buffer.len() as i32);
        if copied <= 0 {
            return None;
        }

        Some(String::from_utf16_lossy(&buffer[..copied as usize]))
    }

    unsafe fn read_process_name(window: HWND) -> Option<String> {
        let mut process_id = 0_u32;
        GetWindowThreadProcessId(window, &mut process_id);
        if process_id == 0 {
            return None;
        }

        let process = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, process_id);
        if process == 0 {
            return None;
        }

        let mut buffer = vec![0_u16; 260];
        let length =
            K32GetModuleBaseNameW(process, 0, buffer.as_mut_ptr(), buffer.len() as u32);
        CloseHandle(process);

        if length == 0 {
            return None;
        }

        Some(String::from_utf16_lossy(&buffer[..length as usize]))
    }
}

#[cfg(not(target_os = "windows"))]
mod platform {
    use super::ActiveWindowInfo;
    use crate::config::DesktopConfig;

    pub fn capture_active_window(_config: &DesktopConfig) -> ActiveWindowInfo {
        ActiveWindowInfo::default()
    }
}
