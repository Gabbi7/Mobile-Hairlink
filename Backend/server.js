require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/mobile-api', routes);

// Health check (optional, but can be used)
app.get('/', (req, res) => {
  res.json({ message: 'HairLink Express API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`HairLink Express API running on port ${PORT}`);
});