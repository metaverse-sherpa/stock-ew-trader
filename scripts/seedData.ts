import { config } from "dotenv";
config(); // Load environment variables

import { YahooFinanceService } from "../src/lib/services/yahooFinanceService";
import { WavePatternService } from "../src/lib/services/wavePatternService";

async function seedData() {
  try {
    console.log("Starting data seeding process...");

    // First, fetch historical data from Yahoo Finance
    console.log("Fetching historical data from Yahoo Finance...");
    await YahooFinanceService.updateAllStocks();
    console.log("Finished fetching historical data");

    // Then generate wave patterns
    console.log("Generating wave patterns...");
    await WavePatternService.generateAllPatterns();
    console.log("Finished generating wave patterns");

    console.log("Data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

// Execute the seed function
seedData().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
