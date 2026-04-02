use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IdleSnapshot {
    pub idle_seconds: u64,
    pub is_idle: bool,
}

#[derive(Clone, Default)]
pub struct IdleDetector;

impl IdleDetector {
    pub fn capture(&self, idle_threshold_seconds: u64) -> IdleSnapshot {
        platform::capture_idle(idle_threshold_seconds)
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use super::IdleSnapshot;
    use windows_sys::Win32::{
        System::SystemInformation::GetTickCount64,
        UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO},
    };

    pub fn capture_idle(idle_threshold_seconds: u64) -> IdleSnapshot {
        unsafe {
            let mut info = LASTINPUTINFO {
                cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
                dwTime: 0,
            };

            if GetLastInputInfo(&mut info) == 0 {
                return IdleSnapshot {
                    idle_seconds: 0,
                    is_idle: false,
                };
            }

            let tick_count = GetTickCount64();
            let idle_millis = tick_count.saturating_sub(info.dwTime as u64);
            let idle_seconds = idle_millis / 1_000;

            IdleSnapshot {
                idle_seconds,
                is_idle: idle_seconds >= idle_threshold_seconds,
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
mod platform {
    use super::IdleSnapshot;

    pub fn capture_idle(_idle_threshold_seconds: u64) -> IdleSnapshot {
        IdleSnapshot {
            idle_seconds: 0,
            is_idle: false,
        }
    }
}
