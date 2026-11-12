use std::{
    io::{Read, Write},
    net::{Ipv4Addr, SocketAddr, TcpListener, TcpStream},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    time::{Duration, Instant},
};

const MODEL_NAME: &str = "Qwen3-Embedding-0.6B-Q8_0.gguf";
const MAX_RESPONSE: u64 = 2_000_000;
const TIMEOUT: Duration = Duration::from_secs(12);

struct Server {
    child: Child,
    port: u16,
    key: String,
}

impl Drop for Server {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

#[derive(Default)]
pub struct MemoryEmbeddings(Mutex<Option<Server>>);

impl MemoryEmbeddings {
    pub fn stop(&self) {
        if let Ok(mut server) = self.0.lock() {
            server.take();
        }
    }

    fn embed(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        let mut slot = self.0.lock().map_err(|e| e.to_string())?;
        if slot.as_mut().is_some_and(|s| !matches!(s.child.try_wait(), Ok(None))) {
            slot.take();
        }
        if slot.is_none() {
            *slot = Some(start_server()?);
        }
        let response = slot.as_ref().unwrap().request(
            "POST",
            "/v1/embeddings",
            &serde_json::json!({"input":texts,"encoding_format":"float"}).to_string(),
        );
        let response = match response {
            Ok(value) => value,
            Err(error) => {
                slot.take();
                return Err(error);
            }
        };
        let rows = response["data"].as_array().ok_or("Invalid local embedding response.")?;
        if rows.len() != texts.len() {
            return Err("Incomplete local embedding response.".into());
        }
        let mut vectors: Vec<Vec<f32>> = vec![Vec::new(); texts.len()];
        for row in rows {
            let index = row["index"].as_u64().ok_or("Missing embedding index.")? as usize;
            let vector = vectors.get_mut(index).ok_or("Invalid embedding index.")?;
            if !vector.is_empty() {
                return Err("Duplicate embedding index.".into());
            }
            *vector = serde_json::from_value(row["embedding"].clone()).map_err(|e| e.to_string())?;
            if vector.is_empty() || vector.len() > 4096 || vector.iter().any(|value| !value.is_finite()) {
                return Err("Invalid local embedding vector.".into());
            }
        }
        Ok(vectors)
    }
}

fn model_path() -> Option<PathBuf> {
    let path=Path::new(r"C:\AI\ManaAI-CV-2\data\memory-models").join(MODEL_NAME);
    path.is_file().then_some(path)
}

fn start_server() -> Result<Server, String> {
    let model = model_path().ok_or("Add the Qwen embedding GGUF to data/memory-models to enable meaning search.")?;
    let executable = Path::new(r"C:\AI\llama-cpp\llama-server.exe");
    if !executable.is_file() {
        return Err("The local llama-server executable is missing.".into());
    }
    let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    drop(listener);
    let stamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e| e.to_string())?.as_nanos();
    let key = format!("mana-memory-{}-{stamp}", std::process::id());
    let mut command = Command::new(executable);
    command.current_dir(executable.parent().unwrap())
        .arg("-m").arg(model)
        .args(["--host", "127.0.0.1", "--port", &port.to_string(), "--api-key", &key,
            "--embedding", "--pooling", "last", "-c", "4096", "-b", "4096", "-ub", "4096",
            "-np", "1", "-ngl", "0", "-t", "4"])
        .stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(windows)] {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000);
    }
    let mut server = Server { child: command.spawn().map_err(|e| e.to_string())?, port, key };
    let started = Instant::now();
    while started.elapsed() < TIMEOUT {
        if !matches!(server.child.try_wait(), Ok(None)) {
            return Err("The local semantic memory model could not start.".into());
        }
        if server.request("GET", "/health", "").is_ok() {
            return Ok(server);
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    Err("The local semantic memory model took too long to start.".into())
}

impl Server {
    fn request(&self, method: &str, route: &str, body: &str) -> Result<serde_json::Value, String> {
        let addr = SocketAddr::from((Ipv4Addr::LOCALHOST, self.port));
        let mut stream = TcpStream::connect_timeout(&addr, Duration::from_millis(500)).map_err(|e| e.to_string())?;
        stream.set_read_timeout(Some(TIMEOUT)).map_err(|e| e.to_string())?;
        stream.set_write_timeout(Some(TIMEOUT)).map_err(|e| e.to_string())?;
        write!(stream, "{method} {route} HTTP/1.1\r\nHost: 127.0.0.1\r\nAuthorization: Bearer {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", self.key, body.len()).map_err(|e| e.to_string())?;
        let mut response = Vec::new();
        stream.take(MAX_RESPONSE + 1).read_to_end(&mut response).map_err(|e| e.to_string())?;
        if response.len() as u64 > MAX_RESPONSE {
            return Err("Local embedding response is too large.".into());
        }
        let end = response.windows(4).position(|bytes| bytes == b"\r\n\r\n").ok_or("Invalid local embedding HTTP response.")?;
        let header = std::str::from_utf8(&response[..end]).map_err(|e| e.to_string())?;
        if header.lines().next().and_then(|line| line.split_whitespace().nth(1)) != Some("200") {
            return Err("The local semantic memory model did not accept the request.".into());
        }
        serde_json::from_slice(&response[end + 4..]).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn memory_embeddings(app: tauri::AppHandle, texts: Vec<String>) -> Result<Vec<Vec<f32>>, String> {
    use tauri::Manager;
    if texts.is_empty() || texts.len() > 8 || texts.iter().any(|text| text.trim().is_empty() || text.len() > 1800) {
        return Err("Choose up to eight short texts to compare.".into());
    }
    tauri::async_runtime::spawn_blocking(move || app.state::<MemoryEmbeddings>().embed(&texts))
        .await.map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "requires the installed local embedding model"]
    fn installed_model_ranks_a_paraphrase_above_an_unrelated_note() {
        let worker = MemoryEmbeddings::default();
        let rows = worker.embed(&[
            "Instruct: Retrieve saved memories that answer the user's question.\nQuery: Which destination did we visit when we went abroad?".into(),
            "We spent a week in Kyoto on vacation.".into(),
            "My favorite breakfast is oatmeal.".into(),
        ]).unwrap();
        let cosine = |a: &[f32], b: &[f32]| {
            let dot = |x: &[f32], y: &[f32]| x.iter().zip(y).map(|(x,y)| x*y).sum::<f32>();
            dot(a,b)/(dot(a,a)*dot(b,b)).sqrt()
        };
        let relevant = cosine(&rows[0], &rows[1]);
        let unrelated = cosine(&rows[0], &rows[2]);
        println!("Relevant: {relevant:.3}, unrelated: {unrelated:.3}");
        assert!(relevant > unrelated + 0.1);
    }
}

