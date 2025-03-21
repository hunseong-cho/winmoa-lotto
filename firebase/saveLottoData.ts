// firebase/saveLottoData.ts
import { db } from "./firebaseConfig";
import { doc, runTransaction, setDoc, getDoc } from "firebase/firestore";

export const saveLottoData = async (data: {
  round: number;
  numbers: number[];
  date: string;
  user?: string;
}) => {
  try {
    const counterRef = doc(db, "lotto_counter", "generation_counter");

    const newId = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);

      let currentCount = 1;
      if (counterSnap.exists()) {
        currentCount = counterSnap.data().count + 1;
      }

      const nextId = `No-${String(currentCount).padStart(9, "0")}`;
      
      // 카운터 갱신
      transaction.set(counterRef, { count: currentCount });

      // 로또 기록 저장 (ID 기준으로 문서 생성)
      const lottoDocRef = doc(db, "lottoHistory", nextId);
      transaction.set(lottoDocRef, {
        ...data,
        id: nextId,
        createdAt: new Date(),
      });

      return nextId;
    });

    console.log("✅ 저장 완료 - ID:", newId);
    return newId;
  } catch (error) {
    console.error("❌ Firestore 트랜잭션 실패:", error);
    return null;
  }
};
