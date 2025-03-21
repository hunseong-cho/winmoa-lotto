import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const q = query(collection(db, "lottoHistory"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => doc.data());
      return res.status(200).json(history);
    } catch (error) {
      console.error("❌ Firestore fetch error:", error);
      return res.status(500).json({ error: "Firestore 데이터 불러오기 실패" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
