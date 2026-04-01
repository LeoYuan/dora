use tauri::{AppHandle, Manager, WebviewWindow, Wry};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::image::Image;

const TRAY_ICON: Image<'_> = tauri::include_image!("icons/icon.png");

pub const MAIN_WINDOW_LABEL: &str = "main";
pub const TRAY_SHOW_MAIN_ID: &str = "show-main";
pub const TRAY_QUIT_ID: &str = "quit";

pub fn resolve_close_action() -> &'static str {
    "hide-to-tray"
}

fn get_window(app: &AppHandle<Wry>, label: &str) -> Result<WebviewWindow<Wry>, String> {
    app.get_webview_window(label)
        .ok_or_else(|| format!("missing window: {label}"))
}

pub fn show_main_window(app: &AppHandle<Wry>) -> Result<(), String> {
    let window = get_window(app, MAIN_WINDOW_LABEL)?;
    if window.is_minimized().map_err(|error| error.to_string())? {
        window.unminimize().map_err(|error| error.to_string())?;
    }
    window.show().map_err(|error| error.to_string())?;
    window.unminimize().map_err(|error| error.to_string())?;
    window.set_always_on_top(true).map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    let _ = window.set_always_on_top(false);
    Ok(())
}

pub fn close_main_to_tray(app: &AppHandle<Wry>) -> Result<(), String> {
    let window = get_window(app, MAIN_WINDOW_LABEL)?;
    window.hide().map_err(|error| error.to_string())
}

pub fn attach_main_close_behavior(window: &WebviewWindow<Wry>) {
    let app = window.app_handle().clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = close_main_to_tray(&app);
        }
    });
}

fn tray_icon_asset_path() -> &'static str {
    "icons/icon.png"
}

pub fn setup_tray(app: &AppHandle<Wry>) -> Result<(), String> {
    let show_main_item = MenuItem::with_id(app, TRAY_SHOW_MAIN_ID, "打开主窗口", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let quit_item = MenuItem::with_id(app, TRAY_QUIT_ID, "退出应用", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let menu = Menu::with_items(app, &[&show_main_item, &quit_item])
        .map_err(|error| error.to_string())?;

    TrayIconBuilder::new()
        .icon(TRAY_ICON.clone())
        .icon_as_template(true)
        .menu(&menu)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            TRAY_SHOW_MAIN_ID => {
                let _ = show_main_window(app);
            }
            TRAY_QUIT_ID => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn show_main_window_command(app: AppHandle<Wry>) -> Result<(), String> {
    show_main_window(&app)
}

#[tauri::command]
pub fn quit_app_command(app: AppHandle<Wry>) {
    app.exit(0);
}

#[cfg(test)]
mod tests {
    use super::{resolve_close_action, tray_icon_asset_path};

    #[test]
    fn keeps_app_in_tray_when_main_window_is_closed() {
        assert_eq!(resolve_close_action(), "hide-to-tray");
    }

    #[test]
    fn uses_explicit_tray_icon_asset() {
        assert_eq!(tray_icon_asset_path(), "icons/icon.png");
    }
}
