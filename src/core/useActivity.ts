import { useEffect, useRef, useState } from "react";
import { chooseActivity, loadActivity, saveActivity } from "./activity";
import type { ActivityInputs } from "./activity";

export function useActivity(input: ActivityInputs) {
  const [activity, setActivity] = useState(loadActivity);
  const current = useRef(activity);
  const latest = useRef(input);
  latest.current = input;
  const started = useRef(false);
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const kind = chooseActivity({ ...latest.current, previous: started.current ? current.current.kind : undefined }, now);
      // A new launch starts a new session; never infer uninterrupted activity during time away.
      if (!started.current || current.current.kind !== kind) {
        started.current = true;
        current.current = { kind, since: now.toISOString() };
        setActivity(current.current);
        saveActivity(current.current);
      }
    };
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [input.state.energy, input.timeZone, input.chatting, input.initiating, input.reflecting, input.journaling, input.waiting,input.working]);
  return activity;
}
