mod settings;
mod storage;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::{Manager, State};

use settings::{
    get_settings, get_settings_status, resolve_settings_api_key, save_settings, SettingsState,
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

fn append_assistant_message(content: String) -> ChatMessage {
    ChatMessage {
        id: format!("{}-assistant", content.len()),
        role: "assistant".to_string(),
        content,
        timestamp: String::new(),
    }
}

fn append_user_message(message: &str) -> ChatMessage {
    ChatMessage {
        id: format!("{}-user", message.len()),
        role: "user".to_string(),
        content: message.to_string(),
        timestamp: String::new(),
    }
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
        .filter(|chat| chat.role == "user" || chat.role == "assistant")
        .take(8)
        .cloned()
        .collect::<Vec<_>>();
    messages.reverse();

    let mut claude_messages = messages
        .into_iter()
        .map(|chat| ClaudeMessage {
            role: chat.role,
            content: chat.content,
        })
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
        .post("https://api.anthropic.com/v1/messages")
        .header("content-type", "application/json")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&request)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        return Err(format!("anthropic request failed: {}", response.status()));
    }

    let response_body: ClaudeResponse = response.json().await.map_err(|error| error.to_string())?;
    response_body
        .content
        .into_iter()
        .find(|item| item.content_type == "text")
        .and_then(|item| item.text)
        .filter(|text| !text.trim().is_empty())
        .ok_or_else(|| "missing text response".to_string())
}

async fn resolve_chat_reply(
    state: &State<'_, AppState>,
    settings_state: &State<'_, SettingsState>,
    message: &str,
) -> String {
    create_claude_reply(state, settings_state, message)
        .await
        .unwrap_or_else(|_| generate_response(message))
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
) -> Result<String, String> {
    let response = resolve_chat_reply(&state, &settings_state, &message).await;
    let user_message = append_user_message(&message);
    let assistant_message = append_assistant_message(response.clone());
    update_chat_history(&state, user_message, assistant_message)?;
    Ok(response)
}

fn generate_response(message: &str) -> String {
    let message_lower = message.to_lowercase();

    if message_lower.contains("你好") || message_lower.contains("hi") || message_lower.contains("hello") {
        "你好呀！今天过得怎么样？".to_string()
    } else if message_lower.contains("累") || message_lower.contains("困") || message_lower.contains("辛苦") {
        "辛苦啦！要不要休息一下？我可以陪你聊聊天，或者帮你记个便签～".to_string()
    } else if message_lower.contains("开心") || message_lower.contains("高兴") || message_lower.contains("棒") {
        "太棒了！看到你开心我也跟着开心呢 ✨".to_string()
    } else if message_lower.contains("难过") || message_lower.contains("伤心") || message_lower.contains("不开心") {
        "抱抱你...想和我说说发生了什么吗？我会一直在这里陪着你的".to_string()
    } else if message_lower.contains("谢谢") {
        "不用谢呀！能帮到你我很开心 😊".to_string()
    } else if message_lower.contains("便签") || message_lower.contains("备忘录") {
        "需要记便签吗？点击我的铃铛图标就可以打开便签功能啦！".to_string()
    } else {
        let responses = [
            "嗯嗯，我在听呢，继续说～",
            "原来是这样啊，明白了！",
            "哈哈，真的吗？",
            "这个有意思！",
            "我明白了，还有其他想聊的吗？",
        ];
        responses[message.len() % responses.len()].to_string()
    }
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
            get_settings_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{build_claude_messages, generate_response, ChatMessage};

    #[test]
    fn returns_greeting_reply() {
        assert_eq!(generate_response("你好 Dora"), "你好呀！今天过得怎么样？");
    }

    #[test]
    fn returns_memo_hint() {
        assert_eq!(
            generate_response("我想记个便签"),
            "需要记便签吗？点击我的铃铛图标就可以打开便签功能啦！"
        );
    }

    #[test]
    fn builds_claude_messages_from_recent_history() {
        let history = vec![
            ChatMessage {
                id: "1".to_string(),
                role: "user".to_string(),
                content: "你好".to_string(),
                timestamp: String::new(),
            },
            ChatMessage {
                id: "2".to_string(),
                role: "assistant".to_string(),
                content: "你好呀".to_string(),
                timestamp: String::new(),
            },
        ];

        let messages = build_claude_messages(&history, "今天天气怎么样");

        assert_eq!(messages.len(), 3);
        assert_eq!(messages[0].role, "user");
        assert_eq!(messages[1].role, "assistant");
        assert_eq!(messages[2].content, "今天天气怎么样");
    }
}
