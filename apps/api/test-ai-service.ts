import { AIService } from "./src/services/aiService";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testAIService() {
  const aiService = new AIService();
  console.log("Testing AIService with DeepSeek...");
  
  try {
    const result = await aiService.executeReasoning({
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "What is 2+2?",
      guruId: "test-guru"
    });
    
    console.log("Result:", result.success ? "✅ SUCCESS" : "❌ FAILED");
    console.log("Text:", result.text);
    console.log("Provider:", result.provider);
  } catch (err: any) {
    console.error("Critical Failure:", err.message);
  }
}

testAIService();
