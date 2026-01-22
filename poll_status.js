const http = require('http');

function getStatus(jobId) {
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: `/api/automation/status/${jobId}`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (d) => {
      data += d;
    });
    res.on('end', () => {
      console.log(`Status for Job ${jobId}:`);
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.end();
}

getStatus(process.argv[2] || '3');
