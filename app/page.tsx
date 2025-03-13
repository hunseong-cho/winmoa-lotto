import LottoGenerator from "@/components/LottoGenerator";
import "../styles/globals.css";

export default function Home() {
  return (
    // 상단 여백 조정은 "PT = 20" 에서 수치 조정    
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen pt-16 px-4 sm:px-10 md:px-20">
      <main className="flex flex-col w-full max-w-4xl gap-10">
        <LottoGenerator />
      </main>
    </div>
  );
}
