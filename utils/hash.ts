// utils/hash.ts
import { createHash } from "crypto";

export const hashUserId = (name: string): string => {
  return createHash("sha256").update(name).digest("hex");
};
