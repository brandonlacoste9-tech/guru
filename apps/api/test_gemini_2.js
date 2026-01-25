const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("hi");
    console.log("Gemini 2.0 Flash Success:", result.response.text());
  } catch (err) {
    console.error("Gemini 2.0 Flash Error:", err.message);
  }
}

testGemini();
