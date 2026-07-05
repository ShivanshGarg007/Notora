const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../controllers/contactController');

// POST /api/contact
router.post('/', sendContactEmail);

module.exports = router; 