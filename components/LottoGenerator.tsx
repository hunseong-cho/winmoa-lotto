"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Button from "@/components/Button";
import { motion } from "framer-motion"; // ✅ Framer Motion 추가
import { saveLottoData } from "@/firebase/saveLottoData";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // ❗firebase db 객체 가져오기
import { generateSecureKey } from "../utils/encryption"; // 상대경로로 고정
import { encryptData } from "../utils/encryption"; // 🔐 암호화 유틸 추가
import { formatDate } from "@/utils/date";  
import debounce from "lodash.debounce";

type LottoEntry = {
  round: number;
  date: string;
  numbers: number[];
  user: string;
  id: string;
  type?: "기본" | "추가";
  createdAt?: Date | string | { seconds: number };
};

const handleSave = () => {
  saveLottoData({
    round: 1100,
    numbers: [3, 11, 20, 28, 34, 42],
    date: "2025-03-21",
    user: "테스트 사용자"
  });
};

const ballSizeClass = {
  default: "w-9 h-9 text-xs md:w-10 md:h-10 md:text-sm lg:w-12 lg:h-12 lg:text-base",
  small:   "w-7 h-7 text-[11px] md:w-9 md:h-9 md:text-xs lg:w-10 lg:h-10 lg:text-sm",
  large:   "w-10 h-10 text-sm md:w-12 md:h-12 md:text-base lg:w-14 lg:h-14 lg:text-lg"
};

const ballSizeMode = "default";

const getBallColor = (num: number): string => {
  if (num <= 10) return "bg-yellow-500";
  if (num <= 20) return "bg-blue-500";
  if (num <= 30) return "bg-red-500";
  if (num <= 40) return "bg-gray-600";
  return "bg-green-500";
};

const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  // ✅ 한국 날짜 포맷을 ISO 포맷으로 변환 시도
  let formattedDate = dateString
    .replace(/\./g, "-") // 점(.)을 대시(-)로 변경
    .replace("오전", "AM") // 오전 → AM
    .replace("오후", "PM"); // 오후 → PM

  let parsedDate = new Date(formattedDate);

  return isNaN(parsedDate.getTime()) ? null : parsedDate; // ✅ 유효한 날짜인지 확인 후 반환
};

const getLottoRound = (entry: { round?: number; date?: string }): number | string => {
  if (!entry) return "회차 정보 없음"; // ✅ entry가 없는 경우 방어
  return entry.round || calculateLottoRound(entry.date);
};

const calculateLottoRound = (dateString: string | null = null): number => {
  const firstLottoDate = new Date("2002-12-07");
  const targetDate = dateString ? parseDate(dateString) : new Date(); // ✅ 현재 날짜 또는 특정 날짜 사용

  if (!targetDate || isNaN(targetDate.getTime())) return 0; // ✅ 유효하지 않은 날짜 방어 코드 추가

  const diffInDays = Math.floor((targetDate.getTime() - firstLottoDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffInDays / 7) + 2; // ✅ 일관된 보정값 적용
};

type WinningNumbersType = {
  round: number;
  date?: string;
  numbers: number[];
  bonus: number;
  totalPrize?: number;
  firstWinnerCount?: number;
  firstWinAmount?: number;
};


const LottoGenerator = () => {
  const [name, setName] = useState<string>("");
  const [generatedHistory, setGeneratedHistory] = useState<LottoEntry[]>([]);
  const [birthdate, setBirthdate] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");
  const [birthDay, setBirthDay] = useState<string>("");
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([]);
  const fetchLottoHistory = async () => {
    try {
      const res = await fetch("/api/lottoHistory");
      if (!res.ok) throw new Error("서버 응답 오류");
      const data = await res.json();
      setGeneratedHistory(data || []);
    } catch (error) {
      console.error("로또 히스토리 로딩 실패:", error);
      setGeneratedHistory([]);
    }
  };
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [luckyStoreDirection, setLuckyStoreDirection] = useState<string>("");
  const [fortuneScore, setFortuneScore] = useState<number | null>(null);
  const [fortuneDetails, setFortuneDetails] = useState<{ star: number; saju: number }>({ star: 0, saju: 0 });
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const [infoGenerated, setInfoGenerated] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [additionalNumbers, setAdditionalNumbers] = useState<number[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [latestWinningNumbers, setLatestWinningNumbers] = useState<{
    round: number;
    date: string;
    numbers: number[];
    bonus: number;
    totalPrize?: string;
    firstWinnerCount?: number;
    firstWinAmount?: number;
  } | null>(null);
  const [winningMap, setWinningMap] = useState<Record<number, { numbers: number[]; bonus: number }>>({});
  const [totalStats, setTotalStats] = useState<{
    "1등": number;
    "2등": number;
    "3등": number;
    "4등": number;
    "5등": number;
  }>({
    "1등": 0,
    "2등": 0,
    "3등": 0,
    "4등": 0,
    "5등": 0,
  });
  const [roundStats, setRoundStats] = useState<
    { round: number; "1등": number; "2등": number; "3등": number; "4등": number; "5등": number }[]
  >([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);
  const [roundStatsPage, setRoundStatsPage] = useState<number>(1);
  const [generationCounter, setGenerationCounter] = useState<number>(1);
  const [generationId, setGenerationId] = useState<string>("");
  const [generationTime, setGenerationTime] = useState<string>("");  
  const [generationNumber, setGenerationNumber] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(16);
  const bannerImages = [
      {
        pcSrc: "/banner-ad.jpg",
        mobileSrc: "/banner-ad-mobile-1.jpg",
        link: "https://www.mobing.co.kr/",
      },
      {
        pcSrc: "/banner-ad-2.jpg",
        mobileSrc: "/banner-ad-mobile-2.jpg",
        link: "https://www.mobing.co.kr/",
      },
      // 추가 배너들...
    ];
  const bannerDelay = 3000; // 슬라이드 전환 시간(ms)

  const [additionalPage, setAdditionalPage] = useState(1);
  const maxAdditions = 5;

  const additionalHistory = useMemo(() => {
    return [...generatedHistory]
      .filter((entry) => entry.type === "추가") // ✅ 추가된 항목만 필터링
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxAdditions);
  }, [generatedHistory]);

  const totalAdditionalPages = additionalHistory.length;
  const currentAdditionalEntry = additionalHistory[additionalPage - 1];

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setItemsPerPage(isMobile ? 8 : 16);
    };
  
    handleResize(); // 초기 실행
    window.addEventListener("resize", handleResize);
  
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!latestWinningNumbers?.round) return;
  
    const end = latestWinningNumbers.round;
    const start = end - 4;
  
    console.log(`📡 최근 5회차 당첨번호 fetching: ${start}~${end}`);
    fetchMultiWinningNumbers(start, end);
  }, [latestWinningNumbers]);

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
  ): string => {
    const matchCount = userNumbers.filter(num => winningNumbers.includes(num)).length;
    const hasBonus = userNumbers.includes(bonusNumber);
  
    if (matchCount === 6) return "1등";
    if (matchCount === 5 && hasBonus) return "2등";
    if (matchCount === 5) return "3등";
    if (matchCount === 4) return "4등";
    if (matchCount === 3) return "5등";
    return "낙첨";
  };

  // ✅ 여기에 붙여넣기
  const fetchMultiWinningNumbers = async (startRound: number, endRound: number): Promise<void> => {
    let newMap: { [key: number]: { numbers: number[]; bonus: number } } = {};

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

  const calculateTotalWinningStats = (
    history: { numbers: number[]; round: number }[],
    winningMap: Record<number, { numbers: number[]; bonus: number }>
  ): { "1등": number; "2등": number; "3등": number; "4등": number; "5등": number } => {
    const stats = { "1등": 0, "2등": 0, "3등": 0, "4등": 0, "5등": 0 };
  
    history.forEach((entry) => {
      const winInfo = winningMap[entry.round];
      if (!winInfo) return;
  
      const rank = checkWinningRank(entry.numbers, winInfo.numbers, winInfo.bonus);
      if (rank in stats) stats[rank as keyof typeof stats]++;
    });
  
    return stats;
  };

  const fetchGenerationCount = async () => {
    try {
      const res = await fetch("/api/lottoCount");
      if (!res.ok) throw new Error("카운트 API 호출 실패");
  
      const data = await res.json();
      setGenerationNumber(data.count + 1); // ✅ 다음 번호를 위한 카운팅
    } catch (err) {
      console.error("🔥 카운트 API 오류:", err);
    }
  };  
  
  const calculateRoundBasedStats = (
    history: { round: number; numbers: number[] }[],
    winningMap: Record<number, { numbers: number[]; bonus: number }>,
    lastRound: number
  ): {
    round: number;
    "1등": number;
    "2등": number;
    "3등": number;
    "4등": number;
    "5등": number;
  }[] => {
    const rounds = Array.from({ length: 5 }, (_, i) => lastRound - i);
    const result: {
      round: number;
      "1등": number;
      "2등": number;
      "3등": number;
      "4등": number;
      "5등": number;
    }[] = [];
  
    rounds.forEach((round) => {
      const entries = history.filter((e) => e.round === round);
      const roundStats = {
        round,
        "1등": 0,
        "2등": 0,
        "3등": 0,
        "4등": 0,
        "5등": 0,
      };
  
      const winInfo = winningMap[round];
      if (!winInfo) {
        result.push(roundStats);
        return;
      }
  
      entries.forEach((entry) => {
        const rank = checkWinningRank(entry.numbers, winInfo.numbers, winInfo.bonus);
        if (rank in roundStats) {
          roundStats[rank as keyof typeof roundStats]++;
        }
      });
  
      result.push(roundStats);
    });
  
    return result;
  };

  const fetchWinningNumbersRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    const debouncedFetch = debounce(async () => {
      try {
        const res = await fetch("/api/proxyWinningNumbers");
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`API 오류: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        if (data.error) return console.error("API 오류 발생:", data.error);

        console.log("✅ 최신 당첨번호:", data);

        setLatestWinningNumbers({
          round: data.round,
          date: data.date,
          numbers: data.numbers,
          bonus: data.bonus,
          totalPrize: data.totalPrize,
          firstWinnerCount: data.firstWinnerCount,
          firstWinAmount: data.firstWinAmount,
        });

        setWinningMap((prev) => ({
          ...prev,
          [data.round]: {
            numbers: data.numbers,
            bonus: data.bonus,
          },
        }));
      } catch (error) {
        console.error("🔥 1등 당첨번호 조회 실패:", error);
      }
    }, 1000); // ✅ 1초 debounce

    // Ref에 저장
    fetchWinningNumbersRef.current = debouncedFetch;

    // 최초 1회 호출
    debouncedFetch();

    // ✅ cleanup: 언마운트 시 cancel()
    return () => {
      debouncedFetch.cancel();
    };
  }, []);  
  
  useEffect(() => {
    if (!latestWinningNumbers?.round || !generatedHistory?.length) return;
  
    const latestRound = latestWinningNumbers.round;
    const total = calculateTotalWinningStats(generatedHistory, winningMap);
    const perRound = calculateRoundBasedStats(generatedHistory, winningMap, latestRound);
  
    setTotalStats(total);
    setRoundStats(perRound);
  }, [latestWinningNumbers, winningMap, generatedHistory]);  

  // 변경된 코드 예시
  const generateAdditionalNumbers = async (): Promise<void> => {
    if (isCounting) return;
    setIsCounting(true);
    await fetchGenerationCount();
    setCountdown(5);
  
    let timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCounting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    setTimeout(async () => {
      const numbers = new Set<number>([...luckyNumbers]);
      while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
      }
      let finalNumbers = [...numbers].sort((a, b) => a - b);
  
      const now = new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).replace(/\./g, ".").replace(/\. /g, ".");
  
      const newHistory = {
        round: currentRound,
        date: now,
        numbers: finalNumbers,
        user: encryptData(name),
        type: "추가" as const, // ✅ 추가
      };
  
      const newId = await saveLottoData(newHistory);
      if (!newId) return;
  
      // ✅ 추가 번호 로컬 상태 업데이트
      setAdditionalNumbers(finalNumbers);
      setGenerationTime(now);
      setGenerationId(newId);

      await fetchLottoHistory();
  
      // ✅ 서버 백업 저장
      fetch("/api/lottoHistory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newHistory, id: newId }),
      }).catch((err) => console.error("추가 기록 저장 실패:", err));
  
      // ✅ 핵심: 서버에서 복호화 + 마스킹된 유저 포함 데이터 다시 불러오기      
    }, 5000);
  };   

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
  
  const getBallColor = (num: number): string => {
    if (num <= 10) return "bg-yellow-400";
    if (num <= 20) return "bg-blue-500";
    if (num <= 30) return "bg-red-500";
    if (num <= 40) return "bg-gray-500";
    return "bg-green-500";
  };
  
  const generateFortuneAndNumbers = async (): Promise<void> => {
    if (!name || !birthdate) return;
  
    const today = new Date().toISOString().split("T")[0];
    const userKey = generateSecureKey(name, birthdate, today);
    const userDocRef = doc(db, "fortuneData", userKey);
  
    try {
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const { star, saju, fortune, luckyNumbers, luckyStoreDirection } = userDoc.data();
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
  
        let uniqueNumbers = new Set<number>();
        while (uniqueNumbers.size < 3) {
          uniqueNumbers.add(Math.floor(Math.random() * 45) + 1);
        }
  
        const luckyNumbers = [...uniqueNumbers];
        setLuckyNumbers(luckyNumbers);
  
        const directions = ["북동", "북서", "남동", "남서", "동", "서", "남", "북"];
        const luckyStoreDirection = directions[(star + saju) % directions.length];
        setLuckyStoreDirection(luckyStoreDirection);
  
        // 🔥 Firebase 저장
        await setDoc(userDocRef, {
          star,
          saju,
          fortune,
          luckyNumbers,
          luckyStoreDirection,
          createdAt: new Date().toISOString()
        });
      }
  
      setInfoGenerated(true);
      setInputDisabled(true);
    } catch (error) {
      console.error("🔥 Firebase 저장 실패:", error);
    }
  };
  
  const generateLottoNumbers = async (): Promise<void> => {
    await fetchGenerationCount();
    
    let numbers = new Set([...luckyNumbers]);
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
  
    const finalNumbers = [...numbers].sort((a, b) => a - b);
  
    const now = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(/\./g, ".").replace(/\. /g, ".");
  
    const newHistory = {
      round: currentRound,
      date: now,
      numbers: finalNumbers,
      user: encryptData(name),
      type: "기본" as const, // ✅ 추가
    };
  
    const newId = await saveLottoData(newHistory);
    if (!newId) return;
  
    setGeneratedNumbers(finalNumbers);
    setGenerationId(newId);
    setGenerationTime(now);

    await fetchLottoHistory();
  
    const fullHistory = { ...newHistory, id: newId };
  
    // ✅ 서버 저장
    fetch("/api/lottoHistory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullHistory),
    }).catch((error) => console.error("로또 기록 저장 오류:", error));
  
    // ✅ 서버에서 복호화+마스킹된 이력 다시 불러오기
    await fetchLottoHistory();
  };  

  const getLottoRound = (entry: { round?: number; date?: string }) =>
  entry.round || calculateLottoRound(entry.date);

  const handleButtonClick = (): void => {
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

  const getMostFrequentNumbers = (
    history: { round: number; numbers: number[] }[]
  ): { number: number; count: number }[] => {
    if (!history || history.length === 0) return [];
  
    const latestRound = Math.max(...history.map(entry => entry.round || 0));
    const numberCounts: Record<number, number> = {};
  
    history
      .filter(entry => entry.round === latestRound)
      .forEach(entry => {
        entry.numbers.forEach(num => {
          numberCounts[num] = (numberCounts[num] || 0) + 1;
        });
      });
  
    return Object.entries(numberCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([num, count]) => ({ number: Number(num), count }));
  };

  const roundsPerPage: number = 3;

  const totalRoundPages = Math.ceil(roundStats.length / roundsPerPage);
  const currentRoundStats = roundStats.slice(
    (roundStatsPage - 1) * roundsPerPage,
    roundStatsPage * roundsPerPage
  );

  const currentMobileStat = roundStats[roundStatsPage - 1];

  const totalMobilePages = roundStats.length;

  const mostFrequentNumbers = useMemo(() => {
    if (!generatedHistory || generatedHistory.length === 0) return [];
    return getMostFrequentNumbers(generatedHistory);
  }, [generatedHistory]);

  const totalPages = Math.ceil(generatedHistory.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const sorted = [...generatedHistory].sort((a, b) => {
      const getTime = (val: any): number => {
        if (!val) return 0;
        if (typeof val === "object" && "seconds" in val) {
          return new Date(val.seconds * 1000).getTime();
        }
        return new Date(val).getTime();
      };
  
      const dateA = getTime(a.createdAt || a.date);
      const dateB = getTime(b.createdAt || b.date);
      return dateB - dateA; // 🔽 최신순 정렬
    });
  
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return sorted.slice(startIdx, endIdx);
  }, [generatedHistory, currentPage, itemsPerPage]);  

  return (    
    <div className="w-full bg-white min-h-screen pt-0">
      <div className="flex flex-col items-center space-y-8">
      <h2 className="text-center text-xl md:text-2xl lg:text-3xl font-bold text-black leading-relaxed">
        🔮 오늘의 행운을 담은 <span className="text-blue-600">로또번호 생성기</span>
      </h2>
      {!infoGenerated && (
        <div className="w-full max-w-full lg:max-w-[730px] bg-white/60 border border-gray-200 backdrop-blur-md rounded-lg p-6 shadow-md">
          <div className="text-center text-base md:text-lg lg:text-xl font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">
            🔐 이름 및 생년월일 입력
          </div>

          <div className="flex flex-col items-center space-y-4">
            <input
              type="text"
              placeholder="이름 입력"
              className="p-3 border rounded text-center w-full max-w-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={inputDisabled}
            />

            <div className="flex flex-col md:flex-row md:items-center items-center gap-4 w-full justify-center">
              <input
                type="number"
                placeholder="출생 연도 (YYYY)"
                className="p-3 border rounded text-center w-full sm:max-w-xs md:max-w-[160px]"
                value={birthYear}
                onChange={(e) => {
                  const inputValue = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setBirthYear(inputValue);
                }}
                disabled={inputDisabled}
                maxLength={4}
              />

              <select
                className="p-3 border rounded text-center w-full sm:max-w-xs md:max-w-[120px]"
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

              <select
                className="p-3 border rounded text-center w-full sm:max-w-xs md:max-w-[120px]"
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
          </div>
        </div>
      )}


    {/* ✅ 로또 번호 출력 부분 추가 */}
    {generatedNumbers.length > 0 && (
      <div className="mt-10 w-full max-w-full lg:max-w-[730px] bg-white/60 border border-gray-200 backdrop-blur-md rounded-lg p-4 shadow-md">
        <div className="text-center text-base md:text-lg lg:text-xl font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">      
        번호 생성 완료!{" "}
        <span className="text-blue-600 font-bold">
          ({`No-${generationNumber?.toString().padStart(9, "0")}`})
        </span>
      </div>

        <div className="flex justify-center items-center gap-2 mb-2">
          <span className="font-bold text-sm text-gray-800">{currentRound}회</span>
          {generatedNumbers.map((num, index) => (
            <motion.span
              key={`gen-ball-${index}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.5 }}
              className={`${ballSizeClass[ballSizeMode]} ${getBallColor(num)} text-white rounded-full text-center flex items-center justify-center font-bold`}
            >
              {num}
            </motion.span>
          ))}
        </div>

        <div className="text-center text-xs text-gray-500">
          by <span className="font-semibold">by guest</span> 🕒 {generationTime}
        </div>
      </div>
    )}


      {/* ✅ 추가 생성된 번호 (초기화 기능 포함) */}
      {infoGenerated && currentAdditionalEntry && currentAdditionalEntry.type === "추가" && (
        <div className="w-full max-w-full lg:max-w-[730px] bg-white/60 border border-gray-200 backdrop-blur-md rounded-lg p-4 shadow-md mt-6">
          <div className="text-center text-base md:text-lg lg:text-xl font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">
            🎉 추가 생성 완료!{" "}
            <span className="text-blue-600 font-bold">
              ({`No-${currentAdditionalEntry.id?.toString().padStart(9, "0")}`})
            </span>
          </div>

          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="font-bold text-sm text-gray-800">
              {currentAdditionalEntry.round}회
            </span>
            {currentAdditionalEntry.numbers.map((num, index) => (
              <motion.span
                key={`add-${num}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`${ballSizeClass[ballSizeMode]} ${getBallColor(num)} text-white rounded-full text-center flex items-center justify-center font-bold`}
              >
                {num}
              </motion.span>
            ))}
          </div>

          <div className="text-center text-xs text-gray-500">
            by <span className="font-semibold">guest</span> 🕒 {currentAdditionalEntry.date}
          </div>
        </div>
      )}

      {infoGenerated && totalAdditionalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setAdditionalPage((prev) => Math.max(prev - 1, 1))}
            disabled={additionalPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            ◀ 이전
          </button>

          <span className="text-gray-700 font-semibold">
            {additionalPage} / {totalAdditionalPages}
          </span>

          <button
            onClick={() => setAdditionalPage((prev) => Math.min(prev + 1, totalAdditionalPages))}
            disabled={additionalPage === totalAdditionalPages}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            다음 ▶
          </button>
        </div>
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
        <div className="w-full max-w-full lg:max-w-[730px] bg-white/60 border border-gray-200 backdrop-blur-md rounded-lg p-4 shadow-md mt-6">
          <div className="text-center text-base md:text-lg lg:text-xl font-semibold text-green-700 border-b border-green-200 pb-2 mb-4">
            🌟 오늘의 행운 정보
          </div>

          <div className="text-center text-lg font-bold text-green-600 mb-1">
            행운 지수: {fortuneScore} / 100
          </div>

          <div className="text-center text-sm text-gray-700 mb-2">
            ⭐ 별자리 {fortuneDetails.star}점 / 🔴 사주 {fortuneDetails.saju}점
          </div>

          <div className="text-center text-sm text-gray-500 mb-1">
            ✨ 행운의 판매점 방향: <span className="font-semibold">{luckyStoreDirection}</span>
          </div>

          <div className="text-center text-sm text-blue-600">
            🎯 행운 숫자: {luckyNumbers.join(", ")}
          </div>
        </div>     

      {mostFrequentNumbers.length > 0 && (
        <div className="w-full max-w-full lg:max-w-[730px] bg-white/60 border border-gray-200 backdrop-blur-md rounded-lg p-4 shadow-md mt-6">
          <div className="text-center text-base md:text-lg lg:text-xl font-semibold text-red-600 border-b border-red-200 pb-2 mb-4">
            🔥 {currentRound}회차 가장 많이 생성된 번호 TOP 6 🔥
          </div>

          <div className="flex gap-4 mt-4 justify-center flex-wrap">
            {mostFrequentNumbers.map(({ number, count }) => (
              <div key={number} className={`${ballSizeClass[ballSizeMode]} ${getBallColor(number)} text-white rounded-full flex flex-col items-center justify-center leading-tight`}>
                <span className="text-sm md:text-base font-bold">{number}</span>
                <span className="text-[10px] md:text-xs">{count}회</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ 전체 누적 당첨 통계 - 가로 정렬 */}
      <div className="w-full max-w-full lg:max-w-[730px] bg-white/60 border border-gray-200 backdrop-blur-md rounded-lg p-4 shadow-md mt-6">
        <div className="text-center text-base md:text-lg lg:text-xl font-semibold text-gray-800 border-b border-gray-300 pb-2 mb-4">
          📊 전체 누적 당첨 통계
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-gray-700 text-sm">
          {Object.entries(totalStats).map(([rank, count], i) => (
            <div key={rank} className="flex items-center gap-1">
              🎯 {rank}: {count}개
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-full lg:max-w-[730px] bg-white/60 border border-gray-200 backdrop-blur-md rounded-lg p-4 shadow-md mt-6">
        <div className="text-center text-base md:text-lg lg:text-xl font-semibold text-gray-800 border-b border-gray-300 pb-2 mb-4">
          📅 최근 회차별 당첨 통계
        </div>

        {roundStats.length === 0 ? (
          <p className="text-sm text-gray-500">⚠ 회차별 통계 데이터가 없습니다.</p>
        ) : (
          <>
            {/* ✅ 모바일 전용 - 1개씩 보여주기 */}
            <div className="block md:hidden">
              <div className="bg-white text-center p-4 w-full rounded-xl shadow-md border border-gray-200">
                <div className="text-blue-600 font-semibold mb-2">
                  {currentMobileStat?.round}회차 당첨 통계
                </div>
                <div className="text-gray-700 text-sm leading-relaxed space-y-1">
                  <div>🥇 1등: {currentMobileStat["1등"]}개</div>
                  <div>🥈 2등: {currentMobileStat["2등"]}개</div>
                  <div>🥉 3등: {currentMobileStat["3등"]}개</div>
                  <div>🏅 4등: {currentMobileStat["4등"]}개</div>
                  <div>🎖 5등: {currentMobileStat["5등"]}개</div>
                </div>

                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={() => setRoundStatsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={roundStatsPage === 1}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                  >
                    ◀ 이전
                  </button>
                  <span className="text-gray-600 text-sm font-semibold">
                    {roundStatsPage} / {totalMobilePages}
                  </span>
                  <button
                    onClick={() => setRoundStatsPage((prev) => Math.min(prev + 1, totalMobilePages))}
                    disabled={roundStatsPage === totalMobilePages}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                  >
                    다음 ▶
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ 데스크탑 전용 - 여러 개 출력 */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 justify-center w-full max-w-[1024px] mx-auto">
              {currentRoundStats.map((stat) => (
                <div
                  key={stat.round}
                  className="bg-white text-center p-4 rounded-xl shadow-md border border-gray-200 w-full max-w-[300px] mx-auto"
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

            {/* ✅ 데스크탑 전용 페이지네이션 버튼 */}
            <div className="hidden md:flex justify-center gap-4 mt-4">
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
          <h3 className="text-sm md:text-base lg:text-lg leading-loose font-bold text-gray-600 text-center">
            📌 로또번호 생성기 모든 사용자 생성 내역
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentItems.map((entry, index) => (
              <div key={index} className="text-sm text-gray-700 border p-4 rounded-lg flex flex-col items-center">
                {/* ✅ 생성된 회차 먼저 출력 */}
                <div className="text-blue-600 font-semibold">
                  {getLottoRound(entry)}회차
                </div>

                {/* ✅ 생성된 번호 출력 */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {entry.numbers.map((num, i) => (
                    <span
                      key={i}
                      className={`w-8 h-8 md:w-8 md:h-8 text-[10px] md:text-xs ${getBallColor(num)} text-white rounded-full text-center flex items-center justify-center font-bold`}
                    >
                      {num}
                    </span>
                  ))}
                </div>

                {/* ✅ 생성된 시간 마지막 출력 */}
                <div className="flex gap-1 mt-2 text-gray-500 text-sm">
                  {formatDate(entry.createdAt || entry.date)} ({entry.user})
                </div>

              </div>
            ))}
          </div>     

          {latestWinningNumbers && latestWinningNumbers.numbers && (
            <div className="mt-10 w-full max-w-full lg:max-w-[900px] bg-white/60 border border-gray-200 backdrop-blur-md rounded-lg p-4 shadow-md">
              <div className="text-center text-base md:text-lg lg:text-xl font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">
                🎯 {latestWinningNumbers.round}회차 1등 당첨번호
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                {latestWinningNumbers.numbers.map((num, index) => (
                  <span
                    key={index}
                    className={`${ballSizeClass[ballSizeMode]} ${getBallColor(num)} text-white rounded-full font-bold flex items-center justify-center`}
                  >
                    {num}
                  </span>
                ))}
                <span className="text-base font-bold text-black px-1">+</span>
                <span
                  className={`${ballSizeClass[ballSizeMode]} ${getBallColor(latestWinningNumbers.bonus)} text-white rounded-full font-bold flex items-center justify-center`}
                >
                  {latestWinningNumbers.bonus}
                </span>
              </div>

              <div className="text-sm md:text-base text-black text-center">
                💰 1등 당첨금: <span className="font-semibold">{latestWinningNumbers.firstWinAmount?.toLocaleString()}원</span>
              </div>
              <div className="mt-2 text-sm text-black text-center">
                🏆 1등 당첨자 수: <span className="font-medium">{latestWinningNumbers.firstWinnerCount}명</span>
              </div>
            </div>
          )}

          {/* 🚀 롤링 광고 배너 - PC용 */}
          <div className="w-full flex justify-center mt-10 px-4 hidden md:flex">
            <a
              href={bannerImages[currentBannerIndex].link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-[730px] transition-opacity duration-700 ease-in-out"
            >
              <motion.div
                key={`pc-banner-${currentBannerIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="overflow-hidden rounded-lg shadow-md w-full"
              >
                <img
                  src={bannerImages[currentBannerIndex].pcSrc} // 👉 PC 전용 이미지
                  alt={`PC 배너 ${currentBannerIndex + 1}`}
                  className="w-full h-auto object-cover rounded-lg"
                />
              </motion.div>
            </a>
          </div>

          {/* 🚀 롤링 광고 배너 - 모바일용 */}
          <div className="w-full flex justify-center mt-10 px-4 md:hidden">
            <a
              href={bannerImages[currentBannerIndex].link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-[100%] transition-opacity duration-700 ease-in-out"
            >
              <motion.div
                key={`mobile-banner-${currentBannerIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="overflow-hidden rounded-lg shadow-md w-full"
              >
                <img
                  src={bannerImages[currentBannerIndex].mobileSrc} // 👉 모바일 전용 이미지
                  alt={`모바일 배너 ${currentBannerIndex + 1}`}
                  className="w-full h-auto object-cover rounded-lg"
                />
              </motion.div>
            </a>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default LottoGenerator;
