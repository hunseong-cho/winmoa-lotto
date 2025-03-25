import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { decryptData } from "@/utils/encryption";

// ✅ 마스킹 함수 직접 정의 (utils/mask.ts 제거 가정)
const maskUserName = (name) => {
  if (!name) return "익명";
  if (name.length === 1) return "*";
  if (name.length === 2) return "*" + name[1];
  return "*".repeat(name.length - 2) + name.slice(-1);
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { id } = req.query;

    try {
      // ✅ 특정 ID로 조회 요청 시
      if (id) {
        const ref = doc(db, "lottoHistory", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          return res.status(404).json({ error: "해당 문서 없음" });
        }

        const data = snap.data();
        const decrypted = decryptData(data.user);
        const maskedUser = maskUserName(decrypted);

        return res.status(200).json({
          ...data,
          id: snap.id,
          user: maskedUser,
          createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? "",
        });
      }

      // ✅ 전체 목록 조회 시 (초기 로딩)
      const q = query(collection(db, "lottoHistory"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const history = snapshot.docs.map(doc => {
        const data = doc.data();

        let maskedUser = "익명";
        try {
          const decrypted = decryptData(data.user);
          maskedUser = maskUserName(decrypted);
        } catch (err) {
          console.warn("🔐 복호화 실패:", err);
        }

        return {
          ...data,
          id: doc.id,
          user: maskedUser,
          createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? "",
        };
      });

      return res.status(200).json(history);
    } catch (error) {
      console.error("❌ Firestore fetch error:", error);
      return res.status(500).json({ error: "데이터 불러오기 실패" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
