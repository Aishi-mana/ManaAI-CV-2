use std::io::Write;
use std::io::{BufRead, BufReader};
use tauri::Emitter;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

#[derive(Default)]
pub struct Speech(pub Mutex<Option<Child>>);

const SPEAK_SCRIPT: &str = r#"$ErrorActionPreference='Stop'; [Console]::InputEncoding=[System.Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.Speech;
Add-Type -ReferencedAssemblies ([System.Speech.Synthesis.SpeechSynthesizer].Assembly.Location) -TypeDefinition 'using System; using System.Speech.Synthesis; public static class ManaVisemes { public static void Attach(SpeechSynthesizer s) { s.VisemeReached += delegate(object sender, VisemeReachedEventArgs e) { Console.WriteLine(e.Viseme); Console.Out.Flush(); }; } }';
$p=[Console]::In.ReadToEnd() | ConvertFrom-Json; $s=[System.Speech.Synthesis.SpeechSynthesizer]::new(); try { $s.SelectVoice($p.voice); $s.Rate=$p.rate; $s.Volume=$p.volume; [ManaVisemes]::Attach($s); $s.Speak($p.text) } finally { $s.Dispose() }"#;

fn command(script: &str) -> Command {
    let mut cmd = Command::new("powershell.exe");
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", script]);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    cmd
}

#[tauri::command]
pub async fn speech_voices() -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let output = command("$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.Speech; $s=[System.Speech.Synthesis.SpeechSynthesizer]::new(); try { $v=@($s.GetInstalledVoices() | Where-Object Enabled | ForEach-Object { $_.VoiceInfo.Name }); ConvertTo-Json -InputObject $v -Compress } finally { $s.Dispose() }").output().map_err(|e| e.to_string())?;
        if !output.status.success() { return Err("Windows speech voices could not be loaded.".into()); }
        serde_json::from_slice(&output.stdout).map_err(|e| format!("Could not read Windows voices: {e}"))
    }).await.map_err(|e| e.to_string())?
}

pub fn stop(state: &Speech) -> Result<(), String> {
    if let Some(mut child) = state.0.lock().map_err(|e| e.to_string())?.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok(())
}

#[tauri::command]
pub fn speech_stop(state: tauri::State<Speech>) -> Result<(), String> { stop(&state) }

#[tauri::command]
pub fn speech_speak(app: tauri::AppHandle, state: tauri::State<Speech>, text: String, voice: String, playback_id: String, rate:i32, volume:i32) -> Result<(), String> {
    validate_controls(rate,volume)?;
    if text.trim().is_empty() || text.len() > 30_000 || voice.len() > 200 || playback_id.len() > 100 {
        return Err("Choose a voice and a reply under 30 KB to read aloud.".into());
    }
    stop(&state)?;
    // Reply text travels only as JSON on stdin; it never becomes executable shell code.
    let mut child = command(SPEAK_SCRIPT)
        .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null()).spawn().map_err(|e| e.to_string())?;
    let input = serde_json::to_vec(&serde_json::json!({"text":text,"voice":voice,"rate":rate,"volume":volume})).map_err(|e| e.to_string())?;
    if let Err(e) = child.stdin.take().ok_or("Speech input unavailable")?.write_all(&input) {
        let _ = child.kill(); let _ = child.wait(); return Err(e.to_string());
    }
    let output=child.stdout.take().ok_or("Speech timing unavailable")?;
    *state.0.lock().map_err(|e| e.to_string())? = Some(child);
    std::thread::spawn(move || {
        for line in BufReader::new(output).lines().map_while(Result::ok) {
            if let Ok(viseme)=line.trim().parse::<u8>() {
                if viseme<=21 { let _=app.emit("speech-viseme",serde_json::json!({"playbackId":playback_id,"viseme":viseme})); }
            }
        }
        let _=app.emit("speech-viseme",serde_json::json!({"playbackId":playback_id,"viseme":0}));
    });
    Ok(())
}

#[cfg(all(test, windows))]
mod tests {
    use super::*;
    #[test]
    fn windows_speech_reads_unicode_json_as_data_into_wave() {
        let path = std::env::temp_dir().join(format!("mana-speech-test-{}.wav", std::process::id()));
        let script = SPEAK_SCRIPT.replace("$s.Speak($p.text)", "$s.SetOutputToWaveFile($p.path); $s.Speak($p.text)")
            .replace("$s.SelectVoice($p.voice);", "");
        let mut child = command(&script).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().unwrap();
        let data = serde_json::to_vec(&serde_json::json!({"text":"Hello café. $(throw 'must remain text')", "path":path,"rate":2,"volume":40})).unwrap();
        child.stdin.take().unwrap().write_all(&data).unwrap();
        let output = child.wait_with_output().unwrap();
        assert!(output.status.success(), "{}", String::from_utf8_lossy(&output.stderr));
        let bytes = std::fs::read(&path).unwrap();
        assert_eq!(&bytes[..4], b"RIFF");
        assert!(bytes.len() > 44);
        let timings=String::from_utf8(output.stdout).unwrap();
        assert!(timings.lines().any(|line|line.parse::<u8>().is_ok_and(|v|v>0&&v<=21)), "No mouth timing events: {timings}");
        std::fs::remove_file(path).unwrap();
    }
    #[test]
    fn stop_terminates_and_reaps_owned_helper() {
        let child = command("Start-Sleep -Seconds 30").spawn().unwrap();
        let state = Speech(Mutex::new(Some(child)));
        stop(&state).unwrap();
        assert!(state.0.lock().unwrap().is_none());
        stop(&state).unwrap();
    }
}

fn validate_controls(rate:i32,volume:i32)->Result<(),String>{
    if !(-10..=10).contains(&rate)||!(0..=100).contains(&volume){return Err("Speech speed must be -10 to 10 and volume 0 to 100.".into());}
    Ok(())
}

#[cfg(test)]
mod control_tests {
    #[test]
    fn speed_and_volume_reject_invalid_values_before_playback(){
        for (rate,volume) in [(0,100),(-10,0),(10,100)]{assert!(super::validate_controls(rate,volume).is_ok());}
        for (rate,volume) in [(-11,50),(11,50),(0,-1),(0,101)]{assert!(super::validate_controls(rate,volume).is_err());}
    }
}

#[tauri::command]
pub fn speech_running(state: tauri::State<Speech>) -> Result<bool, String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    let Some(child) = slot.as_mut() else { return Ok(false); };
    match child.try_wait().map_err(|e| e.to_string())? {
        None => Ok(true),
        Some(status) => { *slot = None; if status.success() { Ok(false) } else { Err("Windows could not read this reply aloud. Check the selected voice.".into()) } }
    }
}
