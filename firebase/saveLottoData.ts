// firebase/saveLottoData.ts
import { db } from "./firebaseConfig";
import { doc, runTransaction, setDoc, getDoc } from "firebase/firestore";
import { encryptData } from "@/utils/encryption";

export const saveLottoData = async (data: {
  round: number;
  numbers: number[];
  date: string;
  user?: string;
  type?: "기본" | "추가"; // ✅ type 허용
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

      const encryptedUser = data.user ? encryptData(data.user) : undefined;

      const lottoDocRef = doc(db, "lottoHistory", nextId);

      // ✅ type 필드 추가 포함
      transaction.set(lottoDocRef, {
        ...data,
        type: data.type || "기본", // 🔥 구분값 기본 지정
        user: encryptedUser,
        id: nextId,
        createdAt: new Date(),
      });

      transaction.set(counterRef, { count: currentCount });

      return nextId;
    });

    console.log("✅ 저장 완료 - ID:", newId);
    return newId;
  } catch (error) {
    console.error("❌ Firestore 트랜잭션 실패:", error);
    return null;
  }
};
