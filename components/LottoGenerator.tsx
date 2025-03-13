"use client";

import React, { useState, useEffect, useMemo } from "react";
import Button from "@/components/Button";
import { motion } from "framer-motion"; // ✅ Framer Motion 추가

const parseDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;

  let formattedDate = dateString
    .replace(/\./g, "-")
    .replace("오전", "AM")
    .replace("오후", "PM");

  const parsedDate = new Date(formattedDate);

  return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getLottoRound = (entry: { round?: number; date?: string | null }): string | number => {
  if (!entry) return "회차 정보 없음";
  return entry.round || calculateLottoRound(entry.date);
};

// ✅ calculateLottoRound - 타입 명시 수정
const calculateLottoRound = (dateString: string | null = null): number => {
  const firstLottoDate = new Date("2002-12-07");
  const targetDate = dateString ? parseDate(dateString) : new Date();

  if (!targetDate || isNaN(targetDate.getTime())) return 0; // 🚨 여기서 문자열 반환 ❌ 안됨

  const diffInDays = Math.floor((targetDate.getTime() - firstLottoDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffInDays / 7) + 2;
};

const LottoGenerator = () => {
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [luckyNumbers, setLuckyNumbers] = useState([]);
  const [generatedNumbers, setGeneratedNumbers] = useState([]);
  const [luckyStoreDirection, setLuckyStoreDirection] = useState("");
  const [generatedHistory, setGeneratedHistory] = useState([]);
  const [fortuneScore, setFortuneScore] = useState(null);
  const [fortuneDetails, setFortuneDetails] = useState({ star: 0, saju: 0 });
  const [inputDisabled, setInputDisabled] = useState(false);
  const [infoGenerated, setInfoGenerated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [additionalNumbers, setAdditionalNumbers] = useState([]); // ✅ 추가 생성된 번호들 저장
  const [countdown, setCountdown] = useState(0); // ✅ 카운트다운 상태
  const [isCounting, setIsCounting] = useState(false); // ✅ 카운트다운 진행 여부
  const [latestWinningNumbers, setLatestWinningNumbers] = useState([]);
  const [winningMap, setWinningMap] = useState({}); // 회차별 1등번호+보너스 저장
  const [totalStats, setTotalStats] = useState({ "1등": 0, "2등": 0, "3등": 0, "4등": 0, "5등": 0 });
  const [roundStats, setRoundStats] = useState([]); // 최근 5회차별 당첨 통계
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerImages = [
    { src: "/banner-ad.jpg", link: "https://www.mobing.co.kr/" },
    { src: "/banner-ad-2.jpg", link: "https://www.mobing.co.kr/" },
    { src: "/banner-ad-3.jpg", link: "https://lineagem.plaync.com/" }
  ];
  const bannerDelay = 3000; // 슬라이드 전환 시간(ms)
  const [roundStatsPage, setRoundStatsPage] = useState(1);
  const roundsPerPage = 3;
  const itemsPerPage = 16;

  useEffect(() => {
    fetchWinningNumbers(); // ✅ 컴포넌트 마운트 시 1등 당첨번호 불러오기
  }, []);  

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, bannerDelay);
  
    return () => clearInterval(timer); // cleanup
  }, [bannerImages.length, bannerDelay]);  

  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      setBirthdate(`${birthYear}-${birthMonth}-${birthDay}`);
    }
  }, [birthYear, birthMonth, birthDay]);  

  useEffect(() => {
    setCurrentRound(calculateLottoRound()); // ✅ 현재 회차 계산
  }, []);

  useEffect(() => {
    // ✅ 1. 로또 히스토리 불러오기 (초기 로드 시 1회 실행)
    const fetchLottoHistory = async () => {
      try {
        const res = await fetch("/api/lottoHistory");
        if (!res.ok) throw new Error("서버 응답 오류");
        const data = await res.json();
        setGeneratedHistory(data || []);
      } catch (error) {
        console.error("로또 히스토리 로드 중 오류:", error);
        setGeneratedHistory([]);
      }
    };
  
    fetchLottoHistory();
  
    // ✅ 2. 운세 정보 생성 후 자동으로 로또 번호 생성
    if (infoGenerated && luckyNumbers.length > 0) {
      generateLottoNumbers();
    }
  }, [infoGenerated, luckyNumbers]); // 🎯 `infoGenerated` 또는 `luckyNumbers` 변경 시 실행

  const checkWinningRank = (
    userNumbers: number[],
    winningNumbers: number[],
    bonusNumber: number
  ): number => {
    const matchCount = userNumbers.filter((num) => winningNumbers.includes(num)).length;
    const hasBonus = userNumbers.includes(bonusNumber);
  
    if (matchCount === 6) return 1;
    if (matchCount === 5 && hasBonus) return 2;
    if (matchCount === 5) return 3;
    if (matchCount === 4) return 4;
    if (matchCount === 3) return 5;
    return 0; // 낙첨
  };

  const fetchMultiWinningNumbers = async (startRound: number, endRound: number): Promise<void> => {
    let newMap: Record<number, { numbers: number[]; bonus: number }> = {}; // <-- 핵심 수정 포인트!
  
    for (let i = endRound; i >= startRound; i--) {
      try {
        const res = await fetch(`/api/lotto?drwNo=${i}`);
        const data = await res.json();
  
        if (data?.numbers && data?.bonus != null) {
          newMap[i] = {
            numbers: data.numbers,
            bonus: data.bonus
          };
        }
      } catch (err) {
        console.warn(`❌ ${i}회차 실패`);
      }
    }
  
    setWinningMap(newMap);
  };

  type LottoEntry = { round: number; numbers: number[] };
  type WinningMap = Record<number, { numbers: number[]; bonus: number }>;
  
  const calculateRoundBasedStats = (
    history: LottoEntry[],
    winningMap: WinningMap,
    lastRound: number
  ): { round: number; rankCounts: Record<string, number> }[] => {
    const rounds = Array.from({ length: 5 }, (_, i) => lastRound - i);
    const result = [];
  
    for (const round of rounds) {
      const rankCounts: Record<string, number> = { "1등": 0, "2등": 0, "3등": 0, "4등": 0, "5등": 0 };
      const winInfo = winningMap[round];
      if (!winInfo) {
        result.push({ round, rankCounts }); // ✅ 빈 값도 넣을 수 있음
        continue;
      }
  
      const filteredHistory = history.filter((entry) => entry.round === round);
      filteredHistory.forEach((entry) => {
        const rank = checkWinningRank(entry.numbers, winInfo.numbers, winInfo.bonus);
        if (rank in rankCounts) rankCounts[rank]++;
      });
  
      result.push({ round, rankCounts });
    }
  
    return result;
  }; 

  const fetchWinningNumbers = async () => {
    try {
      const res = await fetch("/api/proxyWinningNumbers"); // ✅ 서버 프록시 API 호출
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API 오류: ${res.status} - ${errorText}`);
      }
  
      const data = await res.json();
  
      if (data.error) {
        console.error("API 오류 발생:", data.error);
        return;
      }
  
      console.log("✅ 최신 당첨번호:", data);
  
      // ✅ 1등 당첨번호 상태 업데이트
      setLatestWinningNumbers({
        round: data.round,
        date: data.date,
        numbers: data.numbers, // ✅ 당첨 번호 배열
        bonus: data.bonus, // ✅ 보너스 번호
        totalPrize: data.totalPrize,
        firstWinnerCount: data.firstWinnerCount,
        firstWinAmount: data.firstWinAmount,
      });

      // 📌 회차별 당첨번호 저장
      setWinningMap(prev => ({
        ...prev,
        [data.round]: {
          numbers: data.numbers,
          bonus: data.bonus
        }
      }));
  
    } catch (error) {
      console.error("1등 당첨번호 조회 오류:", error);
    }
  };
  
  // ✅ useEffect를 통해 최신 회차 1등 당첨번호 가져오기
  useEffect(() => {
    fetchWinningNumbers();
  }, []);
  
  useEffect(() => {
    if (!latestWinningNumbers?.round || !generatedHistory?.length) return;
  
    const latestRound = latestWinningNumbers.round;
    const total = calculateTotalWinningStats(generatedHistory, winningMap);
    const perRound = calculateRoundBasedStats(generatedHistory, winningMap, latestRound);
  
    setTotalStats(total);
    setRoundStats(perRound);
  }, [latestWinningNumbers, winningMap, generatedHistory]);  

  const generateAdditionalNumbers = () => {
    if (isCounting) return; // ✅ 이미 카운트다운 중이면 중복 실행 방지
  
    setIsCounting(true);
    setCountdown(5); // ✅ 5초 카운트 시작
  
    let timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCounting(false); // ✅ 카운트다운 종료
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    setTimeout(() => {
      let numbers = new Set([...luckyNumbers]); // ✅ 행운번호 포함
      while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
      }
  
      let finalNumbers = [...numbers].sort((a, b) => a - b);
      setAdditionalNumbers(finalNumbers); // ✅ 한 줄에서 번호 변경
  
      // ✅ 추가 생성된 번호도 히스토리에 저장
      let newHistory = {
        round: currentRound, // ✅ 현재 회차
        date: new Date().toLocaleString(), // ✅ 현재 날짜
        numbers: finalNumbers,
        user: name || "Guest",
      };
  
      setGeneratedHistory((prevHistory) => [...prevHistory, newHistory]);
  
      // ✅ 서버에도 추가 내역 저장 (선택 사항)
      fetch("/api/lottoHistory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newHistory),
      }).catch((error) => {
        console.error("추가 생성된 로또 기록 저장 오류:", error);
      });
  
    }, 5000); // ✅ 5초 후 실행
  }; // ✅ 함수 끝을 올바르게 닫기 (세미콜론 필요) 
  
  // ✅ 기존: fetchWinningNumbers() 실행용 useEffect
  useEffect(() => {
    fetchWinningNumbers();
  }, []);

  // ✅ 기존: currentRound 계산용 useEffect
  useEffect(() => {
    setCurrentRound(calculateLottoRound());
  }, []);

  useEffect(() => {
    if (!latestWinningNumbers?.round || !Object.keys(winningMap).length || !generatedHistory?.length) return;
  
    const total = calculateTotalWinningStats(generatedHistory, winningMap);
    const perRound = calculateRoundBasedStats(generatedHistory, winningMap, latestWinningNumbers.round);
  
    setTotalStats(total);
    setRoundStats(perRound);
  
  }, [winningMap, latestWinningNumbers, generatedHistory]);
  
  const getBallColor = (num) => {
    if (num <= 10) return "bg-yellow-400";
    if (num <= 20) return "bg-blue-500";
    if (num <= 30) return "bg-red-500";
    if (num <= 40) return "bg-gray-500";
    return "bg-green-500";
  };
  
  const generateFortuneAndNumbers = () => {
    if (!name || !birthdate) return;

    const today = new Date().toISOString().split("T")[0]; // ✅ 현재 날짜 (YYYY-MM-DD)
    const userKey = `${name}_${birthdate}_${today}`; // ✅ 고유 키 생성
    const savedData = localStorage.getItem(userKey);
  
    if (savedData) {
      // ✅ 기존 데이터가 있으면 그대로 사용
      const { star, saju, fortune, luckyNumbers, luckyStoreDirection } = JSON.parse(savedData);
      setFortuneScore(fortune);
      setFortuneDetails({ star, saju });
      setLuckyNumbers(luckyNumbers);
      setLuckyStoreDirection(luckyStoreDirection);
    } else {
  
    let star = Math.floor(Math.random() * 50);
    let saju = Math.floor(Math.random() * 50);
    let fortune = star + saju;
    setFortuneScore(fortune);
    setFortuneDetails({ star, saju });
  
    let uniqueNumbers = new Set();
    while (uniqueNumbers.size < 3) {
      uniqueNumbers.add(Math.floor(Math.random() * 45) + 1);
    }
    setLuckyNumbers([...uniqueNumbers]);
  
    const directions = ["북동", "북서", "남동", "남서", "동", "서", "남", "북"];
    setLuckyStoreDirection(directions[(star + saju) % directions.length]);

    // ✅ 생성된 데이터를 localStorage에 저장하여 동일 데이터 보장
    localStorage.setItem(userKey, JSON.stringify({ star, saju, fortune, luckyNumbers: [...uniqueNumbers], luckyStoreDirection }));
  }
  
    setInfoGenerated(true);
    setInputDisabled(true);
  };
  
  const generateLottoNumbers = () => {
    let numbers = new Set([...luckyNumbers]); // ✅ 행운번호를 먼저 추가
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    
    let finalNumbers = [...numbers].sort((a, b) => a - b);
    setGeneratedNumbers(finalNumbers);
  
    let newHistory = {
      round: currentRound, // ✅ 회차 정보 추가
      date: new Date().toLocaleString(),
      numbers: finalNumbers,
      user: name || "Guest",
    };
  
    fetch("/api/lottoHistory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newHistory),
    })
      .then((res) => res.json())
      .then((data) => setGeneratedHistory(data || []))
      .catch((error) => {
        console.error("로또 기록 저장 오류:", error);
        setGeneratedHistory([]);
      });
  };

  const getLottoRound = (entry) => entry.round || calculateLottoRound(entry.date);

  const handleButtonClick = () => {
    setButtonDisabled(true);
    setTimeout(() => setButtonDisabled(false), 5000);

    if (infoGenerated) {
      setName("");
      setBirthdate("");
      setBirthYear(""); // ✅ 연도(YYYY) 초기화
      setBirthMonth(""); // ✅ 월(MM) 초기화
      setBirthDay(""); // ✅ 일(DD) 초기화
      setLuckyNumbers([]);
      setGeneratedNumbers([]);
      setAdditionalNumbers([]); // ✅ 추가 생성된 번호도 초기화
      setLuckyStoreDirection("");
      setFortuneScore(null);
      setFortuneDetails({ star: 0, saju: 0 });
      setCountdown(0); // ✅ 카운트다운 초기화
      setIsCounting(false); // ✅ 카운트다운 상태 초기화
      setInputDisabled(false);
      setInfoGenerated(false);
    } else {
      generateFortuneAndNumbers();
    }
  };

  const getMostFrequentNumbers = (history) => {
    if (!history || history.length === 0) return [];

      // 🎯 가장 최근 회차 찾기
      const latestRound = Math.max(...history.map(entry => entry.round || 0));

      // 🎯 가장 최근 회차의 번호만 집계
      let numberCounts = {};
      history
        .filter(entry => entry.round === latestRound) // ✅ 최신 회차만 필터링
        .forEach(entry => {
          entry.numbers.forEach(num => {
            numberCounts[num] = (numberCounts[num] || 0) + 1;
          });
        });

      return Object.entries(numberCounts)
        .sort((a, b) => b[1] - a[1]) // ✅ 출현 빈도 높은 순 정렬
        .slice(0, 6) // ✅ 상위 6개 선택
        .map(([num, count]) => ({ number: Number(num), count }));
    };

  const totalRoundPages = Math.ceil(roundStats.length / roundsPerPage);
  const currentRoundStats = roundStats.slice(
    (roundStatsPage - 1) * roundsPerPage,
    roundStatsPage * roundsPerPage
  );

  const mostFrequentNumbers = useMemo(() => {
    if (!generatedHistory || generatedHistory.length === 0) return [];
    return getMostFrequentNumbers(generatedHistory);
  }, [generatedHistory]);

  const totalPages = Math.max(1, Math.ceil(generatedHistory.length / itemsPerPage));
  const currentItems = generatedHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const maskUserName = (name) => {
    if (!name || typeof name !== "string") return "익명"; // ✅ 방어 코드 추가
    const length = name.length;
  
    if (length === 1) return name + "*"; // ✅ 1글자일 경우 처리
    if (length === 2) return name[0] + "*"; // ✅ 2글자일 경우 처리
    if (length === 3) return name[0] + "*" + name[2]; // ✅ 3글자일 경우 처리
    
    return name[0] + "*".repeat(Math.max(0, length - 2)) + name[length - 1]; // ✅ 음수 방지
  };

  return (    
    <div className="w-full bg-white min-h-screen pt-0">
      <div className="flex flex-col items-center pt-10 px-6 pb-10 bg-gray-100 rounded-lg shadow-md space-y-8">

      <div className="bg-yellow-300 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-red-600">
          🎉 {latestWinningNumbers.round}회차 1등 당첨번호 🎉
        </h2>
        
        {/* ✅ 1등 당첨번호 표시 (동일한 크기의 원으로 디자인) */}
        {latestWinningNumbers.numbers ? (
          <div className="flex justify-center space-x-3 mt-4">
            {latestWinningNumbers.numbers.map((num, index) => (
              <span
                key={index}
                className={`w-12 h-12 flex items-center justify-center ${getBallColor(num)} text-white rounded-full text-xl font-bold shadow-md`}
              >
                {num}
              </span>
            ))}
            {/* ✅ 보너스 번호 (동일한 크기의 원으로 표시) */}
            <span className="w-12 h-12 flex items-center justify-center bg-purple-500 text-white rounded-full text-xl font-bold shadow-md">
              + {latestWinningNumbers.bonus}
            </span>
          </div>
        ) : (
          <p className="text-gray-600">📢 당첨번호 업데이트 중...</p>
        )}

        {/* ✅ 1등 당첨금 및 당첨자 수 추가 (크기 및 줄 간격 조정) */}
        <div className="mt-4 text-gray-700 text-lg font-semibold leading-relaxed">
          💰 1등 당첨금: {latestWinningNumbers.firstWinAmount?.toLocaleString()}원
        </div>
        <div className="text-gray-600 text-md leading-relaxed">
          🏆 1등 당첨자 수: {latestWinningNumbers.firstWinnerCount}명
        </div>
      </div>

      <h2 className="text-lg font-bold text-blue-600">🎉 재미로 보는 운세+별자리 로또생성기 🎉</h2>

      {!infoGenerated && (
        <>
        {/* ✅ 이름 입력 */}
        <input
          type="text"
          placeholder="이름 입력"
          className="mt-4 p-3 border rounded text-center"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={inputDisabled}
        />

        {/* ✅ 생년월일 입력 (연도 + 월 + 일) */}
        <div className="flex gap-2 mt-4">
          {/* ✅ 연도(YYYY) 입력 */}
          <input
            type="number"
            placeholder="출생 연도 (YYYY)"
            className="p-3 border rounded text-center w-28"
            value={birthYear}
            onChange={(e) => {
              const inputValue = e.target.value.replace(/\D/g, "").slice(0, 4); // 숫자만 입력 & 4자리 제한
              setBirthYear(inputValue);
            }}
            disabled={inputDisabled}
            maxLength={4} // 입력 길이 제한
          />

          {/* ✅ 월(MM) 선택 */}
          <select
            className="p-3 border rounded text-center"
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
            disabled={inputDisabled}
          >
            <option value="">월</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                {i + 1}월
              </option>
            ))}
          </select>

          {/* ✅ 일(DD) 선택 */}
          <select
            className="p-3 border rounded text-center"
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
            disabled={inputDisabled}
          >
            <option value="">일</option>
            {[...Array(31)].map((_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                {i + 1}일
              </option>
            ))}
          </select>
        </div>
      </>
      )}

    {/* ✅ 로또 번호 출력 부분 추가 */}
    {generatedNumbers.length > 0 && (
      <div className="mt-4 text-lg font-bold text-gray-700 grid grid-cols-6 gap-4 justify-center">
        {generatedNumbers.map((num, index) => (
          <motion.span
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 1, type: "spring", stiffness: 100 }} // 로또당첨번호 출력딜레이 조절(현재 : 1초)
            className={`p-3 ${getBallColor(num)} text-white rounded-full text-center w-16 h-16 flex flex-col items-center justify-center`} // 페이지 출력 글자/모양크기
          >
            {num}
          </motion.span>
        ))}
      </div>
    )}

      {/* ✅ 추가 생성된 번호 (초기화 기능 포함) */}
      {additionalNumbers.length > 0 && (
        <motion.div
          className="mt-6 flex flex-col items-center justify-center p-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        >
          <h3 className="text-2xl font-extrabold text-black tracking-wide shadow-md">
            🎉 추가 생성된 번호 🎉
          </h3>
          <div className="mt-4 flex gap-4 justify-center">
            {additionalNumbers.map((num, index) => (
              <motion.span
                key={index}
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                className={`p-4 ${getBallColor(num)} text-white font-bold text-lg rounded-full text-center w-16 h-16 flex items-center justify-center shadow-md transform hover:scale-110 transition-transform duration-300`}
              >
                {num}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      <Button 
        onClick={handleButtonClick} 
        disabled={buttonDisabled} 
        className="mt-4 bg-blue-500 text-white px-6 py-3 rounded"
      >
        {infoGenerated ? "처음부터 다시하기" : "번호 생성"}
      </Button>

      {infoGenerated && (
        <>
        <Button 
          onClick={generateAdditionalNumbers} 
          disabled={isCounting} 
          className={`mt-4 ${isCounting ? "bg-gray-400" : "bg-green-500"} text-white px-6 py-3 rounded`}
        >
          {isCounting ? `추가 생성 대기 중 (${countdown}s)` : "추가 생성하기"}
        </Button>

        {/* ✅ 5초 딜레이 동안 표시되는 안내 메시지 & 애니메이션 추가 */}
        {isCounting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-2 text-red-500 text-lg font-bold"
          >
            
          </motion.div>
        )}        
        </>
      )}
        <>
          <div className="mt-4 text-green-600 font-semibold text-center">
            행운 지수: {fortuneScore} / 100
            <div className="text-sm text-gray-600">⭐ 별자리 {fortuneDetails.star}점 / 🔴 사주 {fortuneDetails.saju}점</div>
          </div>
          <div className="mt-2 text-gray-500 text-center">✨ 행운의 판매점 방향: {luckyStoreDirection} ✨</div>
          <div className="mt-2 text-blue-600 text-center">🎯 행운 숫자: {luckyNumbers.join(", ")}</div>
        </>      

      {mostFrequentNumbers.length > 0 && (
        <div className="mt-4">
        <h4 className="font-semibold text-red-600 text-center">
          🔥 {currentRound}회차 가장 많이 생성된 번호 TOP 6 🔥
        </h4>
        <div className="flex gap-4 mt-6 justify-center">
          {mostFrequentNumbers.map(({ number, count }) => (
            <div 
              key={number} 
              className={`p-3 ${getBallColor(number)} text-white rounded-full text-center w-16 h-16 flex flex-col items-center justify-center`}
            >
              <span className="text-lg font-bold">{number}</span>
              <span className="text-sm text-white">{count}회</span>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ✅ 전체 누적 당첨 통계 - 가로 정렬 */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-bold text-gray-700 mb-2">📊 전체 누적 당첨 통계</h3>
        <div className="flex flex-wrap justify-center gap-4 text-gray-700 text-sm bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-1"><span className="font-bold">🎯 1등:</span> {totalStats["1등"]}개</div>
          <div className="flex items-center gap-1"><span className="font-bold">🎯 2등:</span> {totalStats["2등"]}개</div>
          <div className="flex items-center gap-1"><span className="font-bold">🎯 3등:</span> {totalStats["3등"]}개</div>
          <div className="flex items-center gap-1"><span className="font-bold">🎯 4등:</span> {totalStats["4등"]}개</div>
          <div className="flex items-center gap-1"><span className="font-bold">🎯 5등:</span> {totalStats["5등"]}개</div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-xl font-bold text-gray-700 mb-2">📅 최근 회차별 당첨 통계</h3>

        {roundStats.length === 0 ? (
          <p className="text-sm text-gray-500">⚠ 회차별 통계 데이터가 없습니다.</p>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-4">
              {currentRoundStats.map((stat) => (
                <div
                  key={stat.round}
                  className="bg-white text-center p-4 w-64 rounded-xl shadow-md border border-gray-200"
                >
                  <div className="text-blue-600 font-semibold mb-2">{stat.round}회차 당첨 통계</div>
                  <div className="text-gray-700 text-sm leading-relaxed space-y-1">
                    <div>🥇 1등: {stat["1등"]}개</div>
                    <div>🥈 2등: {stat["2등"]}개</div>
                    <div>🥉 3등: {stat["3등"]}개</div>
                    <div>🏅 4등: {stat["4등"]}개</div>
                    <div>🎖 5등: {stat["5등"]}개</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ 페이지 이동 버튼 */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setRoundStatsPage((prev) => Math.max(prev - 1, 1))}
                disabled={roundStatsPage === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
              >
                ◀ 이전
              </button>
              <span className="text-gray-600 text-sm font-semibold">
                {roundStatsPage} / {totalRoundPages}
              </span>
              <button
                onClick={() => setRoundStatsPage((prev) => Math.min(prev + 1, totalRoundPages))}
                disabled={roundStatsPage === totalRoundPages}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
              >
                다음 ▶
              </button>
            </div>
          </>
        )}
      </div>

      {generatedHistory.length > 0 && (
        <div className="mt-8 p-4 border-t">
          <h3 className="font-bold text-gray-600 text-center">
            📌 {currentRound}회차 모든 사용자 로또번호 생성 내역
          </h3>

          {/* 페이지네이션 컨트롤 */}
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              ◀ 이전
            </button>
            <span className="text-gray-700 font-semibold">
              페이지 {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              다음 ▶
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {currentItems.map((entry, index) => (
              <div key={index} className="text-sm text-gray-700 border p-4 rounded-lg flex flex-col items-center">
                {/* ✅ 생성된 회차 먼저 출력 */}
                <div className="text-blue-600 font-semibold">
                  {getLottoRound(entry)}회차
                </div>

                {/* ✅ 생성된 번호 출력 */}
                <div className="flex gap-1 mt-2">
                  {entry.numbers.map((num, i) => (
                    <span key={i} className={`p-2 ${getBallColor(num)} text-white rounded-full text-center w-8 h-8 flex items-center justify-center`}>
                      {num}
                    </span>
                  ))}
                </div>

                {/* ✅ 생성된 시간 마지막 출력 */}
                <div className="flex gap-1 mt-2 text-gray-500 text-sm">
                  {entry.date || "날짜 없음"} ({maskUserName(entry.user)})
                </div>

              </div>
            ))}
          </div>     
          {/* 🚀 롤링 광고 배너 */}
          <div className="w-full flex justify-center mt-10">
            <a
              href={bannerImages[currentBannerIndex].link}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity duration-700 ease-in-out"
            >
              <motion.div
                key={currentBannerIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="overflow-hidden rounded-lg shadow-md"
              >
                <img
                  src={bannerImages[currentBannerIndex].src}
                  alt={`광고 배너 ${currentBannerIndex + 1}`}
                  className="w-[730px] h-[90px] object-cover rounded-lg" // 하단 롤링 배너규격
                />
              </motion.div>
            </a>
          </div>  
          {/* ✅ 오른쪽 고정 배너 1개 */}
          <div className="fixed top-1/2 right-[300px] transform -translate-y-1/2 z-50 hidden lg:block">
            <a
              href="https://www.mobing.co.kr/"  // 👉 원하는 광고 링크 여기 입력
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/side-banner.jpg"         // 👉 배너 이미지 경로
                alt="광고 배너"
                className="w-[180px] h-[620px] object-cover rounded-l-lg shadow-lg"
              />
            </a>
          </div> 
        </div>
      )}
    </div>
  </div>
  );
};

export default LottoGenerator;
