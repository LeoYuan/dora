mod settings;
mod storage;
mod windowing;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::{Manager, State};

use settings::{
    get_settings, get_settings_status, resolve_settings_api_key, save_settings,
    settings_messages_endpoint, test_api_key, SettingsState,
};
use windowing::{
    attach_main_close_behavior, hide_floating_window_command, quit_app_command, setup_tray,
    show_floating_window_command, show_main_window_command, toggle_floating_window_command,
    FloatingWindowState,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Memo {
    id: String,
    content: String,
    color: String,
    position: Position,
    is_pinned: bool,
    created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    x: i32,
    y: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    id: String,
    role: String,
    content: String,
    timestamp: String,
    source: Option<String>,
    debug_error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ChatReply {
    content: String,
    source: String,
    debug_error: Option<String>,
}

impl ChatReply {
    fn claude(content: String) -> Self {
        Self {
            content,
            source: "claude".to_string(),
            debug_error: None,
        }
    }

    fn fallback(content: String, debug_error: String) -> Self {
        Self {
            content,
            source: "fallback".to_string(),
            debug_error: Some(debug_error),
        }
    }
}

impl From<ChatReply> for ChatMessage {
    fn from(reply: ChatReply) -> Self {
        Self {
            id: format!("{}-assistant", reply.content.len()),
            role: "assistant".to_string(),
            content: reply.content,
            timestamp: String::new(),
            source: Some(reply.source),
            debug_error: reply.debug_error,
        }
    }
}

impl ChatMessage {
    fn user(content: &str) -> Self {
        Self {
            id: format!("{}-user", content.len()),
            role: "user".to_string(),
            content: content.to_string(),
            timestamp: String::new(),
            source: None,
            debug_error: None,
        }
    }
}

fn fallback_reply() -> String {
    "哎呀，我有点小迷糊，能再说一遍吗？".to_string()
}

fn append_fallback_reply(debug_error: String) -> ChatReply {
    ChatReply::fallback(fallback_reply(), debug_error)
}

fn build_assistant_message(reply: ChatReply) -> ChatMessage {
    reply.into()
}

fn build_user_message(message: &str) -> ChatMessage {
    ChatMessage::user(message)
}

async fn extract_visible_error(response: reqwest::Response, status: reqwest::StatusCode) -> Result<String, String> {
    let body = response.text().await.unwrap_or_default();
    if body.trim().is_empty() {
        Err(format!("anthropic request failed: {}", status))
    } else {
        Err(format!("anthropic request failed: {} - {}", status, body))
    }
}

fn validate_claude_text(text: String) -> Result<String, String> {
    if text.trim().is_empty() {
        Err("missing text response".to_string())
    } else {
        Ok(text)
    }
}

fn parse_claude_response(response_body: ClaudeResponse) -> Result<String, String> {
    response_body
        .content
        .into_iter()
        .find(|item| item.content_type == "text")
        .and_then(|item| item.text)
        .ok_or_else(|| "missing text response".to_string())
        .and_then(validate_claude_text)
}

fn build_claude_success_reply(content: String) -> ChatReply {
    ChatReply::claude(content)
}

fn build_fallback_reply(error: String) -> ChatReply {
    append_fallback_reply(error)
}

fn reply_or_fallback(result: Result<String, String>) -> ChatReply {
    match result {
        Ok(content) => build_claude_success_reply(content),
        Err(error) => build_fallback_reply(error),
    }
}

fn is_assistant_role(role: &str) -> bool {
    role == "assistant"
}

fn is_user_or_assistant(role: &str) -> bool {
    role == "user" || role == "assistant"
}

fn chat_message_to_claude_message(chat: ChatMessage) -> ClaudeMessage {
    ClaudeMessage {
        role: if is_assistant_role(&chat.role) {
            "assistant".to_string()
        } else {
            "user".to_string()
        },
        content: chat.content,
    }
}

fn persist_chat_reply(
    state: &State<AppState>,
    user_message: ChatMessage,
    assistant_message: ChatMessage,
) -> Result<(), String> {
    update_chat_history(state, user_message, assistant_message)
}

pub struct AppState {
    memos: Mutex<Vec<Memo>>,
    memo_store_path: PathBuf,
    chat_history: Mutex<Vec<ChatMessage>>,
    chat_history_path: PathBuf,
}

impl AppState {
    fn new(memo_store_path: PathBuf, chat_history_path: PathBuf) -> Self {
        Self {
            memos: Mutex::new(load_memos(&memo_store_path)),
            memo_store_path,
            chat_history: Mutex::new(load_chat_history(&chat_history_path)),
            chat_history_path,
        }
    }
}

#[derive(Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    system: String,
    messages: Vec<ClaudeMessage>,
}

#[derive(Serialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ClaudeResponse {
    content: Vec<ClaudeContent>,
}

#[derive(Deserialize)]
struct ClaudeContent {
    #[serde(rename = "type")]
    content_type: String,
    text: Option<String>,
}

fn load_chat_history(path: &PathBuf) -> Vec<ChatMessage> {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn persist_chat_history(path: &PathBuf, messages: &[ChatMessage]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let content = serde_json::to_string_pretty(messages).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

fn update_chat_history(
    state: &State<AppState>,
    user_message: ChatMessage,
    assistant_message: ChatMessage,
) -> Result<(), String> {
    let mut history = state.chat_history.lock().map_err(|error| error.to_string())?;
    history.push(user_message);
    history.push(assistant_message);
    persist_chat_history(&state.chat_history_path, &history)
}


fn update_memo_in_list(memos: &mut [Memo], memo: &Memo) {
    if let Some(existing) = memos.iter_mut().find(|current| current.id == memo.id) {
        *existing = memo.clone();
    }
}

fn build_claude_messages(history: &[ChatMessage], message: &str) -> Vec<ClaudeMessage> {
    let mut messages = history
        .iter()
        .rev()
        .filter(|chat| is_user_or_assistant(&chat.role))
        .take(8)
        .cloned()
        .collect::<Vec<_>>();
    messages.reverse();

    let mut claude_messages = messages
        .into_iter()
        .map(chat_message_to_claude_message)
        .collect::<Vec<_>>();
    claude_messages.push(ClaudeMessage {
        role: "user".to_string(),
        content: message.to_string(),
    });

    claude_messages
}

async fn create_claude_reply(
    state: &State<'_, AppState>,
    settings_state: &State<'_, SettingsState>,
    message: &str,
) -> Result<String, String> {
    if message.trim().is_empty() {
        return Err("empty message".to_string());
    }

    let settings = settings_state.current_settings()?;
    let (_, api_key) = resolve_settings_api_key(&settings);

    if api_key.trim().is_empty() {
        return Err("missing api key".to_string());
    }

    let history = state.chat_history.lock().map_err(|error| error.to_string())?.clone();
    let request = ClaudeRequest {
        model: "claude-opus-4-6".to_string(),
        max_tokens: 1024,
        system: "你是 Dora，一个温暖、友善、简洁的桌面陪伴伙伴。回复要自然、简短、有温度。".to_string(),
        messages: build_claude_messages(&history, message),
    };

    let client = Client::new();
    let response = client
        .post(settings_messages_endpoint(&settings))
        .header("content-type", "application/json")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&request)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let status = response.status();
    if !status.is_success() {
        return extract_visible_error(response, status).await;
    }

    let response_body: ClaudeResponse = response.json().await.map_err(|error| error.to_string())?;
    parse_claude_response(response_body)
}

async fn resolve_chat_reply(
    state: &State<'_, AppState>,
    settings_state: &State<'_, SettingsState>,
    message: &str,
) -> ChatReply {
    reply_or_fallback(create_claude_reply(state, settings_state, message).await)
}

fn load_memos(path: &PathBuf) -> Vec<Memo> {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn persist_memos(path: &PathBuf, memos: &[Memo]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let content = serde_json::to_string_pretty(memos).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

#[tauri::command]
fn get_chat_history(state: State<AppState>) -> Vec<ChatMessage> {
    state.chat_history.lock().unwrap().clone()
}

#[tauri::command]
fn clear_chat_history(state: State<AppState>) -> Result<(), String> {
    let mut history = state.chat_history.lock().map_err(|error| error.to_string())?;
    history.clear();
    persist_chat_history(&state.chat_history_path, &history)
}

#[tauri::command]
fn get_memos(state: State<AppState>) -> Vec<Memo> {
    state.memos.lock().unwrap().clone()
}

#[tauri::command]
fn save_memo(state: State<AppState>, memo: Memo) -> Result<(), String> {
    let mut memos = state.memos.lock().map_err(|error| error.to_string())?;
    memos.push(memo);
    persist_memos(&state.memo_store_path, &memos)
}

#[tauri::command]
fn update_memo(state: State<AppState>, memo: Memo) -> Result<(), String> {
    let mut memos = state.memos.lock().map_err(|error| error.to_string())?;
    update_memo_in_list(&mut memos, &memo);
    persist_memos(&state.memo_store_path, &memos)
}

#[tauri::command]
fn delete_memo(state: State<AppState>, id: String) -> Result<(), String> {
    let mut memos = state.memos.lock().map_err(|error| error.to_string())?;
    memos.retain(|memo| memo.id != id);
    persist_memos(&state.memo_store_path, &memos)
}

#[tauri::command]
async fn chat(
    state: State<'_, AppState>,
    settings_state: State<'_, SettingsState>,
    message: String,
    _history: Vec<ChatMessage>,
) -> Result<ChatReply, String> {
    let response = resolve_chat_reply(&state, &settings_state, &message).await;
    let user_message = build_user_message(&message);
    let assistant_message = build_assistant_message(response.clone());
    persist_chat_reply(&state, user_message, assistant_message)?;
    Ok(response)
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|error| error.to_string())?;
            let memo_store_path = app_data_dir.join("memos.json");
            let chat_history_path = app_data_dir.join("chat-history.json");
            let settings_store_path = app_data_dir.join("settings.json");

            app.manage(AppState::new(memo_store_path, chat_history_path));
            app.manage(SettingsState::new(settings_store_path));
            app.manage(FloatingWindowState::default());

            let main_window = app
                .get_webview_window("main")
                .ok_or_else(|| "missing main window".to_string())?;
            attach_main_close_behavior(&main_window);
            setup_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_memos,
            save_memo,
            delete_memo,
            update_memo,
            get_chat_history,
            clear_chat_history,
            chat,
            get_settings,
            save_settings,
            get_settings_status,
            test_api_key,
            show_main_window_command,
            show_floating_window_command,
            hide_floating_window_command,
            toggle_floating_window_command,
            quit_app_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{build_claude_messages, ChatMessage};

    #[test]
    fn builds_claude_messages_from_recent_history() {
        let history = vec![
            ChatMessage {
                id: "1".to_string(),
                role: "user".to_string(),
                content: "你好".to_string(),
                timestamp: String::new(),
                source: None,
                debug_error: None,
            },
            ChatMessage {
                id: "2".to_string(),
                role: "assistant".to_string(),
                content: "你好呀".to_string(),
                timestamp: String::new(),
                source: Some("claude".to_string()),
                debug_error: None,
            },
        ];

        let messages = build_claude_messages(&history, "今天天气怎么样");

        assert_eq!(messages.len(), 3);
        assert_eq!(messages[0].role, "user");
        assert_eq!(messages[1].role, "assistant");
        assert_eq!(messages[2].content, "今天天气怎么样");
    }
}
