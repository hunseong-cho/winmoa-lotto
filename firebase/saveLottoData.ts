// firebase/saveLottoData.ts
import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export const saveLottoData = async (data: {
  round: number;
  numbers: number[];
  date: string;
  user?: string;
}) => {
  try {
    await addDoc(collection(db, "lottoHistory"), {
      ...data,
      createdAt: new Date(),
    });
    console.log("✅ Firebase 저장 성공");
  } catch (error) {
    console.error("❌ Firebase 저장 실패:", error);
  }
};
