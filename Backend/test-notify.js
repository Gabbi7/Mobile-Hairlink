const http = require('http');

// EDIT THESE TO CHANGE YOUR MESSAGE 
const title = "✨ Wig is Ready!";
const message = "To all donor’s thank you for making the wish of cancer patients and those who have an illness. Your act of selflessness is remarkable.";

const data = JSON.stringify({
  user_id: '87dcfb5b-62ae-45f4-9fdf-c409539b1646', // Your exact HairLink User ID
  title: title,
  message: message
});

const options = {
  hostname: 'localhost',
  port: 4000, // HairLink Express port
  path: '/api/notifications/test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

console.log('🚀 Sending test notification to your HairLink User ID...');

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('✅ Server Response:', responseData);
    console.log('\nCheck your phone now!');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
