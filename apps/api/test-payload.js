const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function testPayload() {
  const body = JSON.parse(fs.readFileSync('ds_body.json', 'utf8'));
  console.log('Testing payload from ds_body.json...');
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  
  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Response:', text);
}

testPayload();
