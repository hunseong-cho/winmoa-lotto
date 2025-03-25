// firebase/getLottoDataById.ts
import { db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export const getLottoDataById = async (id: string) => {
  try {
    const ref = doc(db, "lottoHistory", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();

    return {
      ...data,
      createdAt: data.createdAt?.toDate?.(), // 🔥 핵심 수정
      id: snap.id,
    };
  } catch (err) {
    console.error("❌ Firestore 조회 실패:", err);
    return null;
  }
};
