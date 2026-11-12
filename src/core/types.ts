import type { ImageOrigin } from "./imageOrigin";

export interface Msg {
  id: string;
  role: "user" | "assistant";
  /** Raw text exactly as the model produced it (includes the [emotion] tag). */
  content: string;
  error?: string;
  webSources?: { title: string; url: string }[];
  createdAt?: string;
  imageReport?: { filename:string; description:string; imageId?:string; userConfirmedAvatar?:true; origin?:ImageOrigin };
  generatedPicture?: {filename:string;dataUrl:string;origin?:ImageOrigin};
  diagnostics?: { attempts: { text: string; issue: "repetition" | "capability" | "return-role" | null }[]; comparison?: string };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
