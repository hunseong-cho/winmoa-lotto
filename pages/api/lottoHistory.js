import fs from "fs";
import path from "path";

const filePath = path.resolve(process.cwd(), "lottoHistory.json");

// 기존 데이터 로드
const loadHistory = () => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// 새로운 기록 추가
const saveHistory = (history) => {
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), "utf8");
};

export default function handler(req, res) {
  if (req.method === "GET") {
    const history = loadHistory();
    return res.status(200).json(history);
  } else {
    // ⚠ POST 제거 또는 아래처럼 주석처리
    return res.status(403).json({ error: "Vercel 배포용 - ReadOnly mode" });
  }
}