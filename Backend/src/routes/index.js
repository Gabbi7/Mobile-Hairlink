const express = require('express');
const router = express.Router();

// Import route modules
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const donationRoutes = require('./donation.routes');
const hairRequestRoutes = require('./hair_request.routes');
const notificationRoutes = require('./notification.routes');

// Mount routes
router.use('/', healthRoutes);
router.use('/', authRoutes); // Auth routes are mounted at root of /mobile-api
router.use('/donations', donationRoutes);
router.use('/hair-requests', hairRequestRoutes);
router.use('/notifications', notificationRoutes);
// Push token endpoint lives under /notifications router
router.use('/', notificationRoutes);

module.exports = router;