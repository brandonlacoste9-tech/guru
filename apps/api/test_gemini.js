const OpenAI = require("openai");
require('dotenv').config({ path: '../../.env' });

async function testGemini() {
  const key = process.env.GOOGLE_AI_API_KEY || "AIzaSyB-hDKikTZ7VJIJljtB2YapuM0NO0pALMU";
  console.log('Testing with OpenAI Shim & Key:', key.substring(0, 5) + '...');
  
  const client = new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });
  
  try {
    const result = await client.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Hello!" }]
    });
    console.log('Result:', result.choices[0].message.content);
  } catch (error) {
    console.error('Gemini OpenAI Shim Error:', error.message);
  }
}

testGemini();
