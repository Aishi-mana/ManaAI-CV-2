import { useCallback, useEffect, useRef, useState } from "react";
import { advanceInternalState, conversationState, loadInternalState, replyState, saveInternalState } from "./internalState";
import type { InternalState } from "./internalState";
import type { RecoveryMode } from "./internalState";

export function useInternalState() {
  const [state, setState] = useState(loadInternalState);
  const current = useRef(state);
  const recovery = useRef<RecoveryMode>("idle");
  const update = useCallback((fn: (state: InternalState) => InternalState) => {
    const next = fn(current.current);
    current.current = next;
    setState(next);
    saveInternalState(next);
    return next;
  }, []);
  useEffect(() => {
    saveInternalState(current.current);
    const timer = window.setInterval(() => update((s) => advanceInternalState(s, new Date(), recovery.current)), 60_000);
    return () => window.clearInterval(timer);
  }, [update]);
  const setRecovery = useCallback((mode: RecoveryMode) => {
    if (mode === recovery.current) return;
    update((s) => advanceInternalState(s, new Date(), recovery.current));
    recovery.current = mode;
  }, [update]);
  const talk = useCallback(() => {
    const result = update((s) => conversationState(advanceInternalState(s, new Date(), recovery.current)));
    recovery.current = "idle";
    return result;
  }, [update]);
  const reply = useCallback((emotion: string | null) => update((s) => replyState(advanceInternalState(s, new Date(), recovery.current), emotion)), [update]);
  return { state, talk, reply, setRecovery };
}
