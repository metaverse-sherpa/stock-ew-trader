import { Stock } from "../../shared/lib/types.ts";

const API_BASE_URL = 'http://localhost:5174/api';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  // Add other fields
}

export async function fetchStockData(symbol: string): Promise<StockData> {
  try {
    const response = await fetch(`${API_BASE_URL}/validateStock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
}

export const fetchStocks = async (): Promise<Stock[]> => {
  const response = await fetch('/api/stocks');
  return response.json();
};

export const fetchStockDetails = async (symbol: string): Promise<Stock> => {
  const response = await fetch(`/api/stocks/${symbol}`);
  return response.json();
}; 