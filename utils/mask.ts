/**
 * 복호화된 이름 문자열을 마스킹 처리
 * 예: "홍길동" → "**동"
 */
export const maskUserName = (name: string): string => {
    if (!name) return "익명";
    if (name.length === 1) return "*";
    if (name.length === 2) return "*" + name[1];
    return "*".repeat(name.length - 2) + name.slice(-1);
  };
  