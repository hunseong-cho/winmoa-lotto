export const formatDate = (value: any): string => {
  try {
    if (!value) return "날짜 없음";

    // ✅ Firestore Timestamp
    if (value?.seconds && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleString("ko-KR");
    }

    // ✅ JS Date 객체
    if (value instanceof Date) {
      return value.toLocaleString("ko-KR");
    }

    // ✅ 문자열 파싱 시도
    const date = new Date(value);
    return isNaN(date.getTime()) ? "날짜 오류" : date.toLocaleString("ko-KR");
  } catch {
    return "날짜 오류";
  }
};
