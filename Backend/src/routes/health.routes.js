const express = require('express');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: "HairLink Express API is running"
  });
});

module.exports = router;