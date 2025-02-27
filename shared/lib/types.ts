// Timeframes must be lowercase
export type Timeframe = '1h' | '4h' | '1d';
export type WaveStatus = 'Wave 1' | 'Wave 2' | 'Wave 3' | 'Wave 4' | 'Wave 5 Bullish' | 'Wave A' | 'Wave B' | 'Wave C' | 'Completed';

export interface Stock {
  symbol: string;
  exchange: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockPrice {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  wave1_start?: boolean;
  created_at: string;
}

export interface WavePattern {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  exchange: string;
  status: WaveStatus;
  confidence: number;
  current_price: number;
  start_time: string;
  wave1_start: number;
  wave1_start_time: string;
  wave1_end: number;
  wave1_end_time: string;
  wave2_start: number;
  wave2_end: number;
  wave2_end_time: string;
  wave3_start: number;
  wave3_end: number;
  wave3_end_time: string;
  wave4_start: number;
  wave4_end: number;
  wave4_end_time: string;
  wave5_start: number;
  wave5_end?: number;
  wave5_end_time?: string;
  target_price1: number;
  target_price2: number;
  target_price3: number;
  wave_a_start?: number;
  wave_a_end?: number;
  wave_a_end_time?: string;
  wave_b_start?: number;
  wave_b_end?: number;
  wave_b_end_time?: string;
  wave_c_start?: number;
  wave_c_end?: number;
  wave_c_end_time?: string;
  created_at: string;
  updated_at: string;
}
