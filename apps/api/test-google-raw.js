const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function testGoogle() {
  console.log('Testing Google AI Raw Auth...');
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Say hello!' }]
      }]
    })
  });
  
  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Response Body:', text);
  
  try {
    const json = JSON.parse(text);
    if (json.candidates) {
        console.log('✅ Google AI KEY IS WORKING!');
    } else {
        console.log('❌ Google AI Failed:', json.error?.message || 'Unknown error');
    }
  } catch (e) {
    console.log('❌ Failed to parse response');
  }
}

testGoogle();
