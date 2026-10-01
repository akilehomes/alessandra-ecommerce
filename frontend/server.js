const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 80;
const BUILD_DIR = path.join(__dirname, 'build');

app.use(express.static(BUILD_DIR));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend server running on port ${PORT}`);
});
