// /pages/api/lottoCount.ts
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default async function handler(req, res) {
  try {
    const snapshot = await getDocs(collection(db, "lottoHistory"));
    const count = snapshot.size;

    return res.status(200).json({ count });
  } catch (err) {
    console.error("🔥 lottoCount error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
