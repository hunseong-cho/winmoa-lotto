import { getDocs, getDoc, doc, collection } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (id) {
      // ✅ 단건 조회 로직
      const snap = await getDoc(doc(db, "lottoHistory", id));

      if (!snap.exists()) {
        return res.status(404).json({ error: "Not found" });
      }

      const data = snap.data();
      const maskedUser = "guest";  // 🔐 사용자 마스킹

      return res.status(200).json({
        ...data,
        id: snap.id,
        user: "guest",
        createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? "",
      });
    }

    // ✅ 전체 조회 로직
    const snap = await getDoc(doc(db, "lottoHistory", id));
    const history = snapshot.docs.map((doc) => {
      const data = doc.data();
      const maskedUser = "guest";

      return {
        ...data,
        id: doc.id,
        user: maskedUser,
        createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? "",
      };
    });

    return res.status(200).json(history);

  } catch (err) {
    console.error("🔥 lottoHistory error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
