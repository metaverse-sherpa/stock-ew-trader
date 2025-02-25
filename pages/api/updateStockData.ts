import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Fetch all symbols with needs_update = true
      const { data: stocks, error } = await supabase
        .from('stocks')
        .select('symbol')
        .eq('needs_update', true);

      if (error) {
        throw error;
      }

      // Update data for each symbol
      for (const stock of stocks) {
        const symbol = stock.symbol;

        // Fetch data from Yahoo Finance
        const quote = await yahooFinance.quote(symbol);

        // Update the stocks table
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            price: quote.regularMarketPrice,
            volume: quote.regularMarketVolume,
            pe_ratio: quote.trailingPE,
            needs_update: false, // Mark as updated
          })
          .eq('symbol', symbol);

        if (updateError) {
          throw updateError;
        }
      }

      res.status(200).json({ message: 'Data updated successfully' });
    } catch (err) {
      console.error('Error updating stock data:', err);
      res.status(500).json({ message: 'Failed to update stock data' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 