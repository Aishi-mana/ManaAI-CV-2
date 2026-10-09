import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { useEffect, useState } from "react";
import { initializePersistence } from "./core/persistence";

function Startup() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    void initializePersistence().then(() => { if (active) setReady(true); }).catch((e) => {
      if (active) setError(`Could not load your saved data: ${String(e)}`);
    });
    return () => { active = false; };
  }, [attempt]);
  if (ready) return <App />;
  return <main className="drawer-body" role="status">
    <h1>Mana</h1>
    <p>{error || "Loading your saved data..."}</p>
    {error && <button className="btn" onClick={() => setAttempt((n) => n + 1)}>Retry</button>}
  </main>;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Startup />);
