import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Settings } from "./settings";
import { checkHealth } from "./llm";

export type LlamaStatus = "stopped" | "starting" | "ready" | "error";
export const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Monitor the active server, keeping its port stable until the next start. */
export function useLlama(settings: Settings) {
  const [status, setStatus] = useState<LlamaStatus>("stopped");
  const [detail, setDetail] = useState("");
  const [port, setPort] = useState(settings.port);
  const [running, setRunning] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const generation = useRef(0);
  const timer = useRef<number | null>(null);
  const commands = useRef<Promise<unknown>>(Promise.resolve());

  // Stop requested during Start must run after that Start has finished.
  const command = useCallback((name: string, args?: Record<string, unknown>) => {
    const next = commands.current.catch(() => {}).then(() => invoke(name, args));
    commands.current = next;
    return next;
  }, []);

  const invalidate = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    return ++generation.current;
  }, []);

  const monitor = useCallback((activePort: number, owned: boolean, token: number) => {
    const startedAt = Date.now();
    let wasReady = false;
    const current = () => generation.current === token;
    const poll = async () => {
      if (!current()) return;
      try {
        const health = await checkHealth(activePort);
        if (!current()) return;
        if (owned) {
          const running = await invoke<boolean>("llama_running");
          if (!current()) return;
          if (!running) {
            const log = await invoke<string>("llama_log_tail");
            if (!current()) return;
            setStatus("error");
            setRunning(false);
            setDetail("llama-server stopped. Last lines of its log:\n\n" + log);
            return;
          }
        }
        if (health === "ok") {
          wasReady = true;
          setStatus("ready");
          setDetail("");
        } else if (wasReady) {
          setStatus("error");
          setDetail(`The model on port ${activePort} is ${health === "loading" ? "loading again" : "not responding"}. Waiting for it to recover...`);
        } else if (Date.now() - startedAt >= 180_000) {
          setStatus("error");
          setDetail("Timed out waiting for the model to load (3 minutes). Stop and start the model to retry.");
          return;
        }
      } catch (e) {
        if (!current()) return;
        setStatus("error");
        setDetail(`Could not check model status: ${String(e)}`);
      }
      if (current()) timer.current = window.setTimeout(poll, 1000);
    };
    void poll();
  }, []);

  const start = useCallback(async () => {
    const token = invalidate();
    const s = settingsRef.current;
    setPort(s.port);
    setRunning(true);
    setStatus("starting");
    setDetail("Checking the local model...");
    // Adopt an existing server without requiring paths or taking ownership of it.
    if (await checkHealth(s.port) === "ok") {
      if (generation.current === token) monitor(s.port, false, token);
      return;
    }
    if (generation.current !== token) return;
    if (inTauri) {
      if (!s.exePath || !s.modelPath) {
        setRunning(false);
        setStatus("error");
        setDetail("Open Settings and choose the llama-server file and a model first.");
        return;
      }
      setDetail("Loading the model onto your GPU...");
      try {
        await command("start_llama", {
          exePath: s.exePath, modelPath: s.modelPath, port: s.port,
          ctxSize: s.ctxSize, gpuLayers: s.gpuLayers,
        });
      } catch (e) {
        if (generation.current === token) {
          setRunning(false);
          setStatus("error");
          setDetail(String(e));
        }
        return;
      }
    } else {
      setDetail(`Browser mode: waiting for a llama-server already running on port ${s.port}...`);
    }
    if (generation.current === token) monitor(s.port, inTauri, token);
  }, [command, invalidate, monitor]);

  const stop = useCallback(async () => {
    const token = invalidate();
    setStatus("stopped");
    setRunning(false);
    setDetail("");
    if (inTauri) {
      try {
        await command("stop_llama");
      } catch (e) {
        if (generation.current === token) {
          setRunning(true);
          setStatus("error");
          setDetail(`Could not stop the model: ${String(e)}`);
        }
      }
    }
  }, [command, invalidate]);

  useEffect(() => {
    const token = invalidate();
    const s = settingsRef.current;
    void (async () => {
      const health = await checkHealth(s.port);
      if (generation.current !== token) return;
      if (health === "ok") {
        setRunning(true);
        setPort(s.port);
        monitor(s.port, false, token);
      } else if (s.autoStart && inTauri && s.exePath && s.modelPath) {
        void start();
      }
    })();
    return () => { invalidate(); };
  }, [invalidate, monitor, start]);

  return { status, detail, port, running, start, stop };
}
