const express = require('express');
const router = express.Router();
const multer = require('multer');
const hairRequestController = require('../controllers/hair_request.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configure Multer storage to memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.get('/', hairRequestController.index);
router.post('/', upload.fields([
  { name: 'medical_certificate', maxCount: 1 },
  { name: 'additional_photo', maxCount: 1 }
]), hairRequestController.store);
router.get('/:reference', hairRequestController.show);

module.exports = router;
