use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{env, path::PathBuf, sync::Mutex};
use tauri::State;

use crate::storage::{read_json_or_default, write_json};

pub const CLAUDE_API_KEY_ENV: &str = "ANTHROPIC_API_KEY";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub user_name: String,
    pub theme: String,
    pub provider: String,
    pub api_key: String,
    pub base_url: String,
    #[serde(default = "default_companion_mode")]
    pub companion_mode: String,
}

fn default_companion_mode() -> String {
    "default".to_string()
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            user_name: String::new(),
            theme: "auto".to_string(),
            provider: "claude".to_string(),
            api_key: String::new(),
            base_url: "https://api.anthropic.com".to_string(),
            companion_mode: default_companion_mode(),
        }
    }
}

fn normalized_base_url(base_url: &str) -> String {
    let trimmed = base_url.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        "https://api.anthropic.com".to_string()
    } else {
        trimmed.to_string()
    }
}

pub fn messages_endpoint(base_url: &str) -> String {
    format!("{}/v1/messages", normalized_base_url(base_url))
}

pub fn settings_messages_endpoint(settings: &Settings) -> String {
    messages_endpoint(&settings.base_url)
}

pub fn current_api_source_key_and_endpoint(
    state: &SettingsState,
) -> Result<(String, String, String), String> {
    let settings = state.settings.lock().map_err(|error| error.to_string())?;
    let (source, api_key) = resolve_settings_api_key(&settings);
    let endpoint = settings_messages_endpoint(&settings);
    Ok((source, api_key, endpoint))
}

pub fn current_api_key_and_source(state: &SettingsState) -> Result<(String, String), String> {
    let (source, api_key, _) = current_api_source_key_and_endpoint(state)?;
    Ok((source, api_key))
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SettingsStatus {
    pub source: String,
    pub has_api_key: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyTestResult {
    pub success: bool,
    pub source: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyTestInput {
    pub api_key: String,
    pub base_url: String,
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
    let (source, api_key) = current_api_key_and_source(&state)?;

    Ok(SettingsStatus {
        source,
        has_api_key: !api_key.trim().is_empty(),
    })
}

#[tauri::command]
pub async fn test_api_key(
    state: State<'_, SettingsState>,
    api_key: Option<String>,
    base_url: Option<String>,
) -> Result<ApiKeyTestResult, String> {
    let (source, saved_api_key, saved_endpoint) = current_api_source_key_and_endpoint(&state)?;
    let input = ApiKeyTestInput {
        api_key: api_key.unwrap_or_default(),
        base_url: base_url.unwrap_or_default(),
    };
    let trimmed_api_key = input.api_key.trim();
    let trimmed_base_url = input.base_url.trim();
    let (source, api_key, endpoint) = if trimmed_api_key.is_empty() && trimmed_base_url.is_empty() {
        (source, saved_api_key, saved_endpoint)
    } else {
        (
            "local".to_string(),
            input.api_key,
            messages_endpoint(&input.base_url),
        )
    };

    if api_key.trim().is_empty() {
        return Ok(ApiKeyTestResult {
            success: false,
            source,
            message: "当前没有可用 API Key".to_string(),
        });
    }

    let response = Client::new()
        .post(endpoint)
        .header("content-type", "application/json")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&serde_json::json!({
            "model": "claude-opus-4-6",
            "max_tokens": 32,
            "messages": [{ "role": "user", "content": "Reply with OK only." }]
        }))
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let status = response.status();
    if status.is_success() {
        Ok(ApiKeyTestResult {
            success: true,
            source,
            message: "API Key 可用".to_string(),
        })
    } else {
        Ok(ApiKeyTestResult {
            success: false,
            source,
            message: format!("anthropic request failed: {}", status),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::{default_companion_mode, messages_endpoint, resolve_api_key, Settings};

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

    #[test]
    fn builds_default_messages_endpoint() {
        assert_eq!(
            messages_endpoint(""),
            "https://api.anthropic.com/v1/messages"
        );
    }

    #[test]
    fn builds_custom_messages_endpoint() {
        assert_eq!(
            messages_endpoint("https://code2ai.codes/"),
            "https://code2ai.codes/v1/messages"
        );
    }

    #[test]
    fn defaults_companion_mode_for_legacy_settings() {
        let settings: Settings = serde_json::from_str(
            r#"{"userName":"","theme":"auto","provider":"claude","apiKey":"","baseUrl":"https://api.anthropic.com"}"#,
        )
        .unwrap();

        assert_eq!(settings.companion_mode, default_companion_mode());
    }
}
