import cron from "node-cron";
import { seedData } from "./seedData";

console.log("Starting scheduler...");

// Run at midnight (00:00) every day
cron.schedule("0 0 * * *", async () => {
  console.log("Running scheduled data seed job at:", new Date().toISOString());
  try {
    await seedData();
    console.log("Scheduled data seed completed successfully");
  } catch (error) {
    console.error("Error in scheduled data seed:", error);
  }
});

// Run immediately on startup
seedData().catch((error) => {
  console.error("Error in initial data seed:", error);
});

// Keep the process running
process.stdin.resume();

console.log("Scheduler is running. Press Ctrl+C to exit.");
