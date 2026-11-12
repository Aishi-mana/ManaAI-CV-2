import { isRecord } from "./validation";

export interface ImageOrigin {
  jobId: string;
  model: string;
  seed: number;
  reference: "none" | "avatar" | "turnaround";
}

export function validateImageOrigin(value: unknown): ImageOrigin | undefined {
  if (!isRecord(value) || typeof value.jobId !== "string" || !/^image-\d{1,30}$/.test(value.jobId)
      || typeof value.model !== "string" || !value.model.trim() || value.model.length > 200
      || typeof value.seed !== "number" || !Number.isInteger(value.seed) || value.seed < 0 || value.seed > 0xffffffff
      || (value.reference !== "none" && value.reference !== "avatar" && value.reference !== "turnaround")) return undefined;
  return { jobId: value.jobId, model: value.model, seed: value.seed, reference: value.reference };
}

export function imageOriginLabel(origin: ImageOrigin): string {
  const reference = origin.reference === "avatar" ? "current avatar reference"
    : origin.reference === "turnaround" ? "Mana turnaround reference" : "no avatar reference";
  return `Generated locally in Mana · ${origin.model} · seed ${origin.seed} · ${reference}`;
}
