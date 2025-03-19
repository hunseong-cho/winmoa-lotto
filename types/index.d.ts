export interface WinningNumbers {
    round: number;
    date: string;
    numbers: number[];
    bonus: number;
    totalPrize?: number;
    firstWinnerCount?: number;
    firstWinAmount?: number;
  }