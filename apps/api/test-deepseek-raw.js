const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function testDeepSeek() {
  console.log('Testing DeepSeek Raw Auth...');
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello!' }
      ]
    })
  });
  
  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Response Body:', text);
  
  try {
    const json = JSON.parse(text);
    if (json.choices) {
        console.log('✅ DeepSeek KEY IS WORKING!');
    }
  } catch (e) {}
}

testDeepSeek();
