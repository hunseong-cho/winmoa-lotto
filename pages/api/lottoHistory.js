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
    res.status(200).json(history);
  } else if (req.method === "POST") {
    const newEntry = req.body;
    const history = loadHistory();
    
    history.unshift(newEntry); // 최신 기록이 맨 위로 오게 저장
    saveHistory(history);

    res.status(200).json(history);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
