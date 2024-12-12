const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3002;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle requests to the CSV file specifically
app.get('/Merged_Air_Quality_and_Traffic_Data.csv', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Merged_Air_Quality_and_Traffic_Data.csv'));
});

// Handle all other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
