import axios from 'axios';

async function testE2E() {
  const url = 'http://localhost:4000/api/automation/run';
  const payload = {
    automationId: 'test-automation-001',
    taskDescription: 'Navigate to https://news.ycombinator.com and extract the top headline.',
    config: {
      useCloud: false,
      headless: true,
      llmProvider: 'google'
    }
  };

  console.log(`📡 Triggering E2E Automation via Node.js API: ${url}...`);
  try {
    const response = await axios.post(url, payload);
    console.log('Status Code:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 202 || response.status === 200) {
      console.log('\n🚀 Job successfully queued in BullMQ!');
    } else {
      console.log('\n❌ Failed to queue job.');
    }
  } catch (error: any) {
    console.error('❌ E2E Test Failed');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testE2E();
