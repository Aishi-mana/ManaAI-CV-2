import type { ComponentPropsWithRef } from "react";

const paths = {
  voice: "M4 9v6h4l5 4V5L8 9zM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14",
  export: "M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.2 15.2 21 21",
  close: "m6 6 12 12M18 6 6 18",
  input: "M4 7h16M4 17h16M8 4v6M16 14v6",
  mic: "M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3M9 21h6",
  attach: "m8 13 6-6a2 2 0 0 1 3 3l-8 8a4 4 0 0 1-6-6l9-9a6 6 0 0 1 8 8l-8 8",
} as const;

type Props = Omit<ComponentPropsWithRef<"button">, "children"> & {
  icon: keyof typeof paths;
  label: string;
};

export default function ChatToolButton({ icon, label, className, ...button }: Props) {
  return (
    <span className="chat-tool">
      <button {...button} type="button" className={["btn", "chat-tool-button", className].filter(Boolean).join(" ")} aria-label={label}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={paths[icon]} />
        </svg>
      </button>
      <span className="chat-tool-tip" aria-hidden="true">{label}</span>
    </span>
  );
}
