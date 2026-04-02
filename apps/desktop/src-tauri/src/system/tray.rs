use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    App, Manager,
};

pub fn install(app: &mut App) -> tauri::Result<()> {
    #[cfg(desktop)]
    {
        use tauri::tray::TrayIconBuilder;

        let open = MenuItemBuilder::with_id("open", "Open").build(app)?;
        let focus = MenuItemBuilder::with_id("focus", "Focus Window").build(app)?;
        let menu = MenuBuilder::new(app).items(&[&open, &focus]).build()?;

        let app_handle = app.handle().clone();
        let _tray = TrayIconBuilder::new()
            .tooltip("MedStudy OS Desktop")
            .menu(&menu)
            .on_menu_event(move |_, event| {
                if let Some(window) = app_handle.get_webview_window("main") {
                    match event.id().as_ref() {
                        "open" | "focus" => {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                        _ => {}
                    }
                }
            })
            .build(app)?;
    }

    Ok(())
}
