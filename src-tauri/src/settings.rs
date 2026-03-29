use serde::{Deserialize, Serialize};
use std::{env, path::PathBuf, sync::Mutex};
use tauri::State;

use crate::storage::{read_json_or_default, write_json};

pub const CLAUDE_API_KEY_ENV: &str = "ANTHROPIC_API_KEY";

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub user_name: String,
    pub theme: String,
    pub provider: String,
    pub api_key: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SettingsStatus {
    pub source: String,
    pub has_api_key: bool,
}

pub struct SettingsState {
    settings: Mutex<Settings>,
    settings_path: PathBuf,
}

impl SettingsState {
    pub fn new(settings_path: PathBuf) -> Self {
        Self {
            settings: Mutex::new(read_json_or_default(&settings_path)),
            settings_path,
        }
    }

    pub fn current_settings(&self) -> Result<Settings, String> {
        self.settings
            .lock()
            .map(|settings| settings.clone())
            .map_err(|error| error.to_string())
    }
}

pub fn resolve_api_key(local_key: &str, env_key: Option<String>) -> (String, String) {
    if !local_key.trim().is_empty() {
        return ("local".to_string(), local_key.to_string());
    }

    if let Some(key) = env_key.filter(|value| !value.trim().is_empty()) {
        return ("env".to_string(), key);
    }

    ("missing".to_string(), String::new())
}

#[tauri::command]
pub fn get_settings(state: State<SettingsState>) -> Result<Settings, String> {
    state
        .settings
        .lock()
        .map(|settings| settings.clone())
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_settings(state: State<SettingsState>, settings: Settings) -> Result<(), String> {
    let mut current = state.settings.lock().map_err(|error| error.to_string())?;
    *current = settings;
    write_json(&state.settings_path, &*current)
}

pub fn resolve_settings_api_key(settings: &Settings) -> (String, String) {
    resolve_api_key(&settings.api_key, env::var(CLAUDE_API_KEY_ENV).ok())
}

#[tauri::command]
pub fn get_settings_status(state: State<SettingsState>) -> Result<SettingsStatus, String> {
    let settings = state.settings.lock().map_err(|error| error.to_string())?;
    let (source, api_key) = resolve_settings_api_key(&settings);

    Ok(SettingsStatus {
        source,
        has_api_key: !api_key.trim().is_empty(),
    })
}

#[cfg(test)]
mod tests {
    use super::resolve_api_key;

    #[test]
    fn resolves_env_source_when_only_env_exists() {
        let (source, key) = resolve_api_key("", Some("env-key".to_string()));
        assert_eq!(source, "env");
        assert_eq!(key, "env-key");
    }

    #[test]
    fn resolves_local_source_when_only_local_exists() {
        let (source, key) = resolve_api_key("local-key", None);
        assert_eq!(source, "local");
        assert_eq!(key, "local-key");
    }

    #[test]
    fn local_overrides_env() {
        let (source, key) = resolve_api_key("local-key", Some("env-key".to_string()));
        assert_eq!(source, "local");
        assert_eq!(key, "local-key");
    }

    #[test]
    fn resolves_missing_when_neither_exists() {
        let (source, key) = resolve_api_key("", None);
        assert_eq!(source, "missing");
        assert!(key.is_empty());
    }
}
