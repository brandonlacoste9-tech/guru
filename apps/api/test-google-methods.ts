import { createGoogleGenerativeAI } from "@ai-sdk/google";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testGoogleMethods() {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });

  console.log("Checking if google.chat exists...");
  console.log("google.chat:", typeof (google as any).chat);
}

testGoogleMethods();
