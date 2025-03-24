// firebase/saveLottoData.ts
import { db } from "./firebaseConfig";
import { doc, runTransaction, setDoc, getDoc } from "firebase/firestore";
import { encryptData } from "@/utils/encryption"; // 🔐 AES 암호화 유틸 추가

// 로또 데이터 저장 함수
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

      // ✅ user 값 AES 암호화
      const encryptedUser = data.user ? encryptData(data.user) : undefined;

      // ✅ 로또 기록 저장 (ID 기준으로 문서 생성)
      const lottoDocRef = doc(db, "lottoHistory", nextId);
      transaction.set(lottoDocRef, {
        ...data,
        user: encryptedUser, // 🔐 암호화된 user 저장
        id: nextId,
        createdAt: new Date(),
      });

      // ✅ 카운터 갱신
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
