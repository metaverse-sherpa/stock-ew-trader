import { supabase } from '../../src/lib/supabase.server';

export default class WavePatternService {
  static async generateAllPatterns(
    progressCallback: (message: string, progress?: {
      symbol: string;
      timeframe: string;
      completed: number;
      total: number;
    }) => void,
    symbols?: string[]
  ) {
    // Your server-side logic here
  }
}
