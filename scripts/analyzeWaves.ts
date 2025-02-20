import { config } from "dotenv";
config();

import { WavePatternService } from "../src/lib/services/wavePatternService";

async function analyzeWaves() {
  try {
    console.log("Starting wave pattern analysis...");
    await WavePatternService.generateAllPatterns((message) => {
      console.log(message);
    });
    console.log("Wave pattern analysis completed successfully!");
  } catch (error) {
    console.error("Error analyzing wave patterns:", error);
    throw error;
  }
}

// Execute the analysis function
analyzeWaves().catch((error) => {
  console.error("Analysis failed:", error);
  process.exit(1);
});
