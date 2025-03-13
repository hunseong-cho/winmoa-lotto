export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    const { drwNo } = req.query; // ✅ 쿼리 파라미터 추출

    let targetRound = drwNo ? parseInt(drwNo, 10) : null;
    let responseData = null;

    if (targetRound) {
      // ✅ 1. 특정 회차 요청 (예: /api/lotto?drwNo=1160)
      const response = await fetch(
        `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${targetRound}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.dhlottery.co.kr/",
          },
        }
      );
      responseData = await response.json();

      if (responseData.returnValue !== "success") {
        return res.status(404).json({ error: "해당 회차 정보 없음" });
      }
    } else {
      // ✅ 2. 최신 회차 자동 탐색 (drwNo 없을 때)
      const firstLottoDate = new Date("2002-12-07");
      const today = new Date();
      const diffInDays = Math.floor((today - firstLottoDate) / (1000 * 60 * 60 * 24));
      let estimatedRound = Math.floor(diffInDays / 7) + 2;

      while (estimatedRound > 0) {
        const response = await fetch(
          `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${estimatedRound}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Referer": "https://www.dhlottery.co.kr/",
            },
          }
        );
        responseData = await response.json();

        if (responseData.returnValue === "success") {
          targetRound = responseData.drwNo;
          break;
        }
        estimatedRound--;
      }

      if (!targetRound || !responseData) {
        throw new Error("로또 최신 회차 자동 추정 실패");
      }

      console.log(`🔍 자동 감지된 최신 회차: ${targetRound}`);
    }

    // ✅ 응답 구성 (두 경우 공통)
    res.status(200).json({
      round: responseData.drwNo,
      date: responseData.drwNoDate,
      numbers: [
        responseData.drwtNo1,
        responseData.drwtNo2,
        responseData.drwtNo3,
        responseData.drwtNo4,
        responseData.drwtNo5,
        responseData.drwtNo6,
      ],
      bonus: responseData.bnusNo,
      totalPrize: responseData.firstAccumamnt,
      firstWinnerCount: responseData.firstPrzwnerCo,
      firstWinAmount: responseData.firstWinamnt,
    });

  } catch (error) {
    console.error("🚨 로또 API 호출 오류:", error);
    res.status(500).json({ error: "로또 API 호출 실패" });
  }
}
