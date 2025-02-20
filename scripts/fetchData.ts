import { config } from "dotenv";
config();

import { YahooFinanceService } from "../src/lib/services/yahooFinanceService";

async function fetchData() {
  try {
    console.log("Starting data fetch process...");
    await YahooFinanceService.updateAllStocks();
    console.log("Data fetch completed successfully!");
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

// Execute the fetch function
fetchData().catch((error) => {
  console.error("Fetch failed:", error);
  process.exit(1);
});
