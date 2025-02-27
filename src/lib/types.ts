export interface Stock {
  symbol: string;
  name: string;
  price: number;
  waveStatus: string;
  // Add other fields as needed
}

export interface StockPrice {
  timestamp: string;
  close: number;
  // Add other fields as needed
}

export type Timeframe = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
export type WaveStatus = 'Wave 1' | 'Wave 2' | 'Wave 3' | 'Wave 4' | 'Wave 5' | 'Wave A' | 'Wave B' | 'Wave C';

export interface WavePattern {
  wave1_start: number;
  wave1_start_time: string;
  wave1_end: number | null;
  wave1_end_time: string | null;
  wave2_end: number | null;
  wave2_end_time: string | null;
  wave3_end: number | null;
  wave3_end_time: string | null;
  wave4_end: number | null;
  wave4_end_time: string | null;
  wave5_start: number | null;
  wave5_end: number | null;
  wave5_end_time: string | null;
  status: WaveStatus;
  confidence: number;
  target_price1: number;
  target_price2: number;
  target_price3: number;
  wave_a_start: number;
  wave_a_end: number;
  wave_a_end_time: string;
  wave_b_start: number;
  wave_b_end: number;
  wave_b_end_time: string;
  wave_c_start: number;
  wave_c_end: number;
  wave_c_end_time: string;
} 