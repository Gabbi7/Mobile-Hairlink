const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Test endpoint (No auth required for local testing)
router.post('/test', notificationController.testPush);

router.use(authMiddleware);

// Push token registration
router.post('/register-token', notificationController.saveToken);

// Notification list + read operations
router.get('/', notificationController.index);
router.post('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
