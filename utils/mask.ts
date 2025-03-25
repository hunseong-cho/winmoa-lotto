// utils/mask.ts
import { decryptData } from "./encryption";

/**
 * 암호화된 이름을 복호화 후 마스킹 처리
 * 예: "홍길성" → "***성"
 */
export const maskEncryptedUser = (encrypted: string): string => {
  try {
    const name = decryptData(encrypted);
    if (!name) return "익명";

    const len = name.length;
    if (len === 1) return "*";
    return "*".repeat(len - 1) + name[len - 1]; // 마지막 글자만 노출
  } catch {
    return "익명";
  }
};
