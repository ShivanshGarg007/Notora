const express = require('express');
const router = express.Router();
const { performOCR, upload } = require('../controllers/ocrController');
const { rateLimits } = require('../middlewares/rateLimit');

// Route for OCR processing
router.post('/process', rateLimits.ocr, upload.single('image'), performOCR);

module.exports = router; 