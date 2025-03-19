// /pages/api/lotto.js
export default async function handler(req, res) {
    try {
      const { drwNo } = req.query;
  
      if (!drwNo) {
        return res.status(400).json({ error: "회차 정보가 없습니다." });
      }
  
      const response = await fetch(
        `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.dhlottery.co.kr/",
          },
        }
      );
  
      const data = await response.json();
  
      if (data.returnValue !== "success") {
        return res.status(404).json({ error: "해당 회차 정보 없음" });
      }
  
      res.status(200).json({
        round: data.drwNo,
        date: data.drwNoDate,
        numbers: [
          data.drwtNo1,
          data.drwtNo2,
          data.drwtNo3,
          data.drwtNo4,
          data.drwtNo5,
          data.drwtNo6,
        ],
        bonus: data.bnusNo,
        totalPrize: data.firstAccumamnt,
        firstWinnerCount: data.firstPrzwnerCo,
        firstWinAmount: data.firstWinamnt,
      });
  
    } catch (error) {
      console.error("🚨 lotto API 실패:", error);
      res.status(500).json({ error: "서버 오류" });
    }
  }
  