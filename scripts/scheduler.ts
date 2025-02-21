import cron from "node-cron";
import { YahooFinanceService } from "../src/lib/services/yahooFinanceService";
import { WavePatternService } from "../src/lib/services/wavePatternService";

console.log("Starting scheduler...");

// Run data fetch at midnight (00:00) every day
cron.schedule("0 0 * * *", async () => {
  console.log("Running scheduled data fetch at:", new Date().toISOString());
  try {
    await YahooFinanceService.updateAllStocks();
    console.log("Scheduled data fetch completed successfully");
  } catch (error) {
    console.error("Error in scheduled data fetch:", error);
  }
});

// Run wave analysis at 00:30 every day (after data fetch)
cron.schedule("30 0 * * *", async () => {
  console.log("Running scheduled wave analysis at:", new Date().toISOString());
  try {
    await WavePatternService.generateAllPatterns();
    console.log("Scheduled wave analysis completed successfully");
  } catch (error) {
    console.error("Error in scheduled wave analysis:", error);
  }
});

// Run initial data fetch if INITIAL_FETCH environment variable is set
if (process.env.INITIAL_FETCH === "true") {
  console.log("Running initial data fetch...");
  YahooFinanceService.updateAllStocks()
    .then(() => WavePatternService.generateAllPatterns())
    .then(() => console.log("Initial data fetch completed"))
    .catch((error) => console.error("Error in initial data fetch:", error));
} else {
  console.log("Scheduler started. Waiting for next scheduled run...");
}

// Keep the process running
process.stdin.resume();

console.log("Scheduler is running. Press Ctrl+C to exit.");
