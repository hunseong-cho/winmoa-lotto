import { getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const snapshot = await getDocs(collection(db, "lottoHistory"));
    const count = snapshot.size;
    res.status(200).json({ count });
  } catch (err) {
    console.error("🔥 lottoCount error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
