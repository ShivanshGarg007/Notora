const express = require("express");
const router = express.Router();
const { upload, handleMulterError } = require("../middlewares/upload");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");
const { rateLimits } = require("../middlewares/rateLimit");

const {
  getAllNotes,
  uploadNote,
  updateNote,
  getNoteById,
  deleteNote,
  getPendingNotes,
  reviewNote,
  getAllNotesAdmin
} = require("../controllers/noteController");

const { sendContactEmail } = require('../controllers/contactController');

// Regular user routes
router.get("/", rateLimits.notes, getAllNotes);
router.post("/", rateLimits.notesUpload, authMiddleware, upload, handleMulterError, uploadNote);
router.get("/:id", rateLimits.notes, authMiddleware, getNoteById);
router.put("/:id", rateLimits.notesUpload, authMiddleware, upload, handleMulterError, updateNote);
router.delete("/:id", rateLimits.notes, authMiddleware, deleteNote);

// Admin routes
router.get("/admin/all", rateLimits.admin, authMiddleware, adminMiddleware, getAllNotesAdmin);
router.get("/admin/pending", rateLimits.admin, authMiddleware, adminMiddleware, getPendingNotes);
router.post("/admin/review/:noteId", rateLimits.admin, authMiddleware, adminMiddleware, reviewNote);

// POST /api/contact
router.post('/', sendContactEmail);

module.exports = router;