// ✅ /firebase/saveLottoData.ts
import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const saveLottoData = async (data: {
  round: number;
  numbers: number[];
  date: string;
  user?: string;
}) => {
  try {
    await addDoc(collection(db, "lottoHistory"), {
      ...data,
      createdAt: serverTimestamp(), // ✅ 더 정밀한 서버 기준 시간 추천
    });
    console.log("✅ Firestore 저장 성공");
  } catch (error) {
    console.error("❌ Firestore 저장 실패:", error);
  }
};
