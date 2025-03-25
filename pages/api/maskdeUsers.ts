// pages/api/maskedUsers.ts
import { NextApiRequest, NextApiResponse } from "next";
import { decryptData } from "@/utils/encryption";
import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const maskName = (name: string) => {
  if (!name || name.length < 2) return "익명";
  return "*".repeat(name.length - 2) + name.slice(-1); // 🔒 예: "**수"
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const snapshot = await getDocs(collection(db, "lottoHistory"));
    const results = snapshot.docs.map((doc) => {
      const data = doc.data();
      const user = data.user;

      let maskedUser = "익명";
      try {
        const decrypted = decryptData(user);
        maskedUser = maskName(decrypted);
      } catch (err) {
        console.warn("복호화 실패:", err);
      }

      return {
        ...data,
        id: doc.id,
        maskedUser,
      };
    });

    res.status(200).json(results);
  } catch (err) {
    console.error("API 실패:", err);
    res.status(500).json({ error: "복호화 실패" });
  }
}
