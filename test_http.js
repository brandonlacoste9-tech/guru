const http = require('http');

const data = JSON.stringify({
  automationId: "test-automation-001",
  taskDescription: "Navigate to https://news.ycombinator.com and extract the top headline.",
  config: {
    useCloud: false,
    headless: true,
    llmProvider: "google"
  }
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/automation/run',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
