use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};

const SEARCH_URL: &str = "http://127.0.0.1:8879/search";

#[derive(Serialize)]
pub struct WebSource {
    url: String,
    title: String,
    snippets: Vec<String>,
}

fn web_url(raw: &str) -> Result<tauri::Url, String> {
    let url = tauri::Url::parse(raw).map_err(|_| "Invalid source link.")?;
    if !matches!(url.scheme(), "https" | "http")
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
    {
        return Err("Invalid source link.".into());
    }
    Ok(url)
}

fn search(query: &str) -> Result<Vec<WebSource>, String> {
    let mut command = Command::new("curl.exe");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    let output = command
        .args([
            "--disable",
            "--silent",
            "--fail",
            "--max-time",
            "20",
            "--connect-timeout",
            "3",
            "--max-filesize",
            "1048576",
            "--noproxy",
            "*",
            "--get",
            "--data-urlencode",
            &format!("q={query}"),
            "--data-urlencode",
            "format=json",
            "--data-urlencode",
            "categories=general",
            SEARCH_URL,
        ])
        .stdin(Stdio::null())
        .stderr(Stdio::null())
        .output()
        .map_err(|_| "Could not start the Windows web search client.")?;
    if output.status.code() == Some(7) {
        return Err("Local SearXNG is stopped. Start Docker Desktop and the Mana web search service, then try again.".into());
    }
    if !output.status.success() {
        return Err("Local SearXNG could not return search results. Check that it is running with JSON search enabled.".into());
    }
    parse_sources(&output.stdout)
}

fn parse_sources(body: &[u8]) -> Result<Vec<WebSource>, String> {
    #[derive(Deserialize)]
    struct SearchResult {
        url: String,
        #[serde(default)]
        title: Option<String>,
        #[serde(default)]
        content: Option<String>,
    }
    #[derive(Deserialize)]
    struct Response {
        results: Vec<SearchResult>,
    }
    let response: Response =
        serde_json::from_slice(body).map_err(|_| "Unexpected local SearXNG response.")?;
    let mut seen = std::collections::HashSet::new();
    Ok(response
        .results
        .into_iter()
        .filter_map(|result| {
            let url = web_url(&result.url).ok()?;
            let snippet: String = result.content?.trim().chars().take(850).collect();
            if snippet.is_empty() || url.as_str().len() > 2048 || !seen.insert(url.to_string()) {
                return None;
            }
            let title = result
                .title
                .as_deref()
                .map(str::trim)
                .filter(|t| !t.is_empty())
                .unwrap_or(url.host_str()?)
                .chars()
                .take(200)
                .collect();
            Some(WebSource {
                url: url.to_string(),
                title,
                snippets: vec![snippet],
            })
        })
        .take(5)
        .collect())
}

#[tauri::command]
pub async fn search_web(query: String) -> Result<Vec<WebSource>, String> {
    let query = query.trim();
    if query.is_empty() || query.chars().count() > 600 || query.split_whitespace().count() > 75 {
        return Err("Enter a question of up to 600 characters and 75 words.".into());
    }
    let query = query.to_owned();
    tauri::async_runtime::spawn_blocking(move || search(&query))
        .await
        .map_err(|_| "Web search was interrupted.")?
}

#[tauri::command]
pub fn open_web_source(url: String) -> Result<(), String> {
    let url = web_url(&url)?;
    Command::new("explorer.exe")
        .arg(url.as_str())
        .spawn()
        .map(|_| ())
        .map_err(|_| "Could not open the source in your browser.".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_searxng_results_and_excludes_duplicates_unsafe_or_empty_sources() {
        let sources = parse_sources(
            br#"{"results":[
            {"url":"https://example.org/","title":"Example","content":"Evidence"},
            {"url":"javascript:alert(1)","title":"Unsafe","content":"Ignore"},
            {"url":"https://example.net/","title":"Empty","content":null},
            {"url":"https://example.org/","title":"Duplicate","content":"Evidence"}
        ]}"#,
        )
        .unwrap();
        assert_eq!(sources.len(), 1);
        assert_eq!(sources[0].title, "Example");
    }
}
