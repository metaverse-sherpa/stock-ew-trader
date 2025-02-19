import { seedData } from "./seedData";

console.log("Starting seed process...");

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nGracefully shutting down from SIGTERM");
  process.exit(0);
});

seedData()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
