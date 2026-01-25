const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await models.generateContent("hi");
    console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (err) {
    console.error("Error with gemini-1.5-flash:", err.message);
  }
}

listModels();
