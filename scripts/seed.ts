import { config } from "dotenv";
config();

import { supabase } from "../src/lib/supabase";
import { getHistoricalData } from "./getHistoricalData";
import { analyzeWaves } from "./analyzeWaves";

async function seed() {
  try {
    console.log("Starting seed process...");

    // 1. Get all symbols from the stocks table
    const { data: stocks, error } = await supabase
      .from('stocks')
      .select('symbol');

    if (error) throw error;
    
    console.log(`Found ${stocks.length} stocks to process`);

    // 2. Get historical data for each stock
    console.log("Retrieving historical price data...");
    await getHistoricalData(stocks.map(s => s.symbol));

    // 3. Analyze waves
    console.log("Analyzing waves...");
    await analyzeWaves();

    console.log("Seed process completed successfully!");
  } catch (error) {
    console.error("Seed process failed:", error);
    throw error;
  }
}

// Execute the seed function
seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
}); 