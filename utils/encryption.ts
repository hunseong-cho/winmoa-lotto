// utils/encryption.ts
import CryptoJS from "crypto-js";
import { createHash } from "crypto";

const AES_SECRET = process.env.NEXT_PUBLIC_ENCRYPT_KEY || "default-secret-key";

// ✅ 유저 고유 키 생성
export function generateUserKey(name: string, birth: string, date: string): string {
  const raw = `${name}-${birth}-${date}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32); // 32자 고정
}

/** 📌 AES 암호화 (내부 저장용) */
export const encryptData = (text: string): string => {
  return CryptoJS.AES.encrypt(text, AES_SECRET).toString();
};

/** 📌 AES 복호화 */
export const decryptData = (cipherText: string): string => {
  const bytes = CryptoJS.AES.decrypt(cipherText, AES_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/** 📌 SHA256 키 생성 (문서 ID용) */
export const generateSecureKey = (name: string, birthdate: string, date: string): string => {
  const raw = `${name}_${birthdate}_${date}`;
  return CryptoJS.SHA256(raw).toString();
};

// 테스트 코드 (제거 가능)
console.log("✅ encryption.ts 로딩됨");
