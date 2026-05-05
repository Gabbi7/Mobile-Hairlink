const express = require('express');
const router = express.Router();
const multer = require('multer');
const donationController = require('../controllers/donation.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configure Multer storage to memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.get('/', donationController.index);
router.post('/', upload.fields([
  { name: 'photo_front', maxCount: 1 },
  { name: 'photo_side', maxCount: 1 },
  { name: 'proof_photo', maxCount: 1 }
]), donationController.store);
router.get('/:reference', donationController.show);

module.exports = router;
