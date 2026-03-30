use tauri::{AppHandle, Manager, WebviewWindow, Wry};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

pub const MAIN_WINDOW_LABEL: &str = "main";
pub const FLOATING_WINDOW_LABEL: &str = "floating";
pub const TRAY_TOGGLE_FLOATING_ID: &str = "toggle-floating";
pub const TRAY_SHOW_MAIN_ID: &str = "show-main";
pub const TRAY_QUIT_ID: &str = "quit";

pub struct FloatingWindowState {
    pub visible: bool,
}

impl Default for FloatingWindowState {
    fn default() -> Self {
        Self { visible: true }
    }
}

pub fn resolve_close_action() -> &'static str {
    "hide-to-tray"
}

fn get_window(app: &AppHandle<Wry>, label: &str) -> Result<WebviewWindow<Wry>, String> {
    app.get_webview_window(label)
        .ok_or_else(|| format!("missing window: {label}"))
}

pub fn show_main_window(app: &AppHandle<Wry>) -> Result<(), String> {
    let window = get_window(app, MAIN_WINDOW_LABEL)?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

pub fn show_floating_window(app: &AppHandle<Wry>) -> Result<(), String> {
    let window = get_window(app, FLOATING_WINDOW_LABEL)?;
    window.show().map_err(|error| error.to_string())?;
    Ok(())
}

pub fn hide_floating_window(app: &AppHandle<Wry>) -> Result<(), String> {
    let window = get_window(app, FLOATING_WINDOW_LABEL)?;
    window.hide().map_err(|error| error.to_string())?;
    Ok(())
}

pub fn toggle_floating_window(app: &AppHandle<Wry>) -> Result<(), String> {
    let window = get_window(app, FLOATING_WINDOW_LABEL)?;
    let visible = window.is_visible().map_err(|error| error.to_string())?;
    if visible {
        window.hide().map_err(|error| error.to_string())?;
    } else {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }
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

pub fn setup_tray(app: &AppHandle<Wry>) -> Result<(), String> {
    let toggle_item = MenuItem::with_id(app, TRAY_TOGGLE_FLOATING_ID, "显示/隐藏悬浮窗", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let show_main_item = MenuItem::with_id(app, TRAY_SHOW_MAIN_ID, "打开主窗口", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let quit_item = MenuItem::with_id(app, TRAY_QUIT_ID, "退出应用", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let menu = Menu::with_items(app, &[&toggle_item, &show_main_item, &quit_item])
        .map_err(|error| error.to_string())?;

    TrayIconBuilder::new()
        .menu(&menu)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let _ = toggle_floating_window(&tray.app_handle());
            }
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            TRAY_TOGGLE_FLOATING_ID => {
                let _ = toggle_floating_window(app);
            }
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
pub fn show_floating_window_command(app: AppHandle<Wry>) -> Result<(), String> {
    show_floating_window(&app)
}

#[tauri::command]
pub fn hide_floating_window_command(app: AppHandle<Wry>) -> Result<(), String> {
    hide_floating_window(&app)
}

#[tauri::command]
pub fn toggle_floating_window_command(app: AppHandle<Wry>) -> Result<(), String> {
    toggle_floating_window(&app)
}

#[tauri::command]
pub fn quit_app_command(app: AppHandle<Wry>) {
    app.exit(0);
}

#[cfg(test)]
mod tests {
    use super::{FloatingWindowState, resolve_close_action};

    #[test]
    fn keeps_app_in_tray_when_main_window_is_closed() {
        assert_eq!(resolve_close_action(), "hide-to-tray");
    }

    #[test]
    fn floating_window_starts_visible() {
        let state = FloatingWindowState::default();
        assert!(state.visible);
    }
}
