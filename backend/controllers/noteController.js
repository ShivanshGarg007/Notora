const Note = require("../models/Note");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const streamifier = require('streamifier');
const cacheService = require('../utils/cache');

// Define allowed subjects (same as in Note model)
const ALLOWED_SUBJECTS = [
  "Java",
  "C++",
  "Web Development",
  "Python",
  "Data Structures",
  "Algorithms"
];

const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cachedNote = await cacheService.getCachedNote(id);
    if (cachedNote) {
      console.log(`📦 Cache hit for note: ${id}`);
      return res.status(200).json({
        ...cachedNote,
        _cached: true,
        _cachedAt: new Date().toISOString()
      });
    }

    const note = await Note.findById(id).populate("uploadedBy", "name email");

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Cache the note for future requests
    await cacheService.cacheNote(id, note);

    res.status(200).json(note);
  } catch (err) {
    console.error("GET NOTE ERROR >>>", err);
    res.status(500).json({ error: err.message || "Failed to fetch note" });
  }
};

const getAllNotes = async (req, res) => {
  try {
    const { subject } = req.query;
    let filter = { status: 'approved' }; // Only show approved notes

    if (subject) {
      filter.subject = subject.toLowerCase();
    }

    // Check cache first
    const cachedNotes = await cacheService.getCachedNotesList(subject);
    if (cachedNotes) {
      console.log(`📦 Cache hit for notes list: ${subject || 'all'}`);
      // Always return an array, with optional cache metadata
      return res.status(200).json({
        notes: Array.isArray(cachedNotes) ? cachedNotes : Object.values(cachedNotes),
        _cached: true,
        _cachedAt: new Date().toISOString()
      });
    }

    const notes = await Note.find(filter).populate("uploadedBy", "name email");
    
    // Cache the notes list
    await cacheService.cacheNotesList(subject, notes);

    res.status(200).json({ notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};

const uploadNote = async (req, res) => {
  try {
    console.log("Upload request received:", {
      body: req.body,
      file: req.file,
      user: req.user
    });

    const { title, description, subject, isPremium } = req.body;
    const uploadedBy = req.user._id;

    // Basic validations
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: "Title is required and should be at least 3 characters long." });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({ error: "Description is required and should be at least 5 characters long." });
    }

    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({ error: "Subject is required and must be a string." });
    }

    // Validate subject against allowed subjects (case-insensitive)
    const normalizedSubject = subject.trim();
    const isValidSubject = ALLOWED_SUBJECTS.some(
      allowedSubject => allowedSubject.toLowerCase() === normalizedSubject.toLowerCase()
    );

    if (!isValidSubject) {
      return res.status(400).json({ 
        error: `Invalid subject. Allowed subjects are: ${ALLOWED_SUBJECTS.join(', ')}` 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Get file extension from original filename
    const fileExtension = req.file.originalname.split('.').pop();
    
    // Clean the title for use in filename
    const cleanTitle = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace special chars and spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    // Create a unique identifier (last 6 chars of timestamp)
    const uniqueId = Date.now().toString().slice(-6);
    
    // Combine title and unique ID for the filename
    const publicId = `${cleanTitle}-${uniqueId}`;

    // Upload to Cloudinary using stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "notora",
          resource_type: "raw",
          public_id: publicId,
          format: fileExtension, // Preserve original file format
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const cloudinaryResult = await uploadPromise;
    console.log("File uploaded to Cloudinary:", cloudinaryResult);

    // Create new note
    const newNote = new Note({
      title: title.trim(),
      content: description.trim(),
      subject: normalizedSubject,
      uploadedBy,
      fileUrl: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      isPremium: isPremium === 'true',
      status: 'pending'
    });

    // Save note to database
    const savedNote = await newNote.save();
    console.log("Note saved successfully:", savedNote);

    // Update user's notes array
    await User.findByIdAndUpdate(uploadedBy, {
      $push: { notes: savedNote._id }
    });
    console.log("User's notes array updated");

    // Invalidate relevant caches
    await cacheService.invalidateNoteCache(savedNote._id);

    res.status(201).json({ 
      message: "Note uploaded successfully", 
      note: savedNote 
    });

  } catch (err) {
    console.error("UPLOAD ERROR >>>", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });

    res.status(500).json({ 
      error: err.message || "Failed to upload note. Please try again.",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject } = req.body;

    const updateData = {};

    if (title && typeof title === 'string' && title.trim().length >= 3) {
      updateData.title = title.trim();
    }

    if (description && typeof description === 'string' && description.trim().length >= 5) {
      updateData.description = description.trim();
    }

    if (subject && typeof subject === 'string') {
      updateData.subject = subject.trim().toLowerCase();
    }

    const existingNote = await Note.findById(id);
    if (!existingNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    // If a new file is uploaded, delete the old one and update
    if (req.file) {
      if (existingNote.cloudinaryId) {
        await cloudinary.uploader.destroy(existingNote.cloudinaryId);
      }
      updateData.fileUrl = req.file.path;
      updateData.cloudinaryId = req.file.filename;
    }

    const updatedNote = await Note.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("uploadedBy", "name email");

    // Invalidate relevant caches
    await cacheService.invalidateNoteCache(id);

    res.status(200).json({
      message: "Note updated successfully",
      note: updatedNote
    });
  } catch (err) {
    console.error("UPDATE NOTE ERROR >>>", err);
    res.status(500).json({ error: err.message || "Failed to update note" });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Delete from Cloudinary if exists
    if (note.cloudinaryId) {
      await cloudinary.uploader.destroy(note.cloudinaryId);
    }

    // Remove note from user's notes array
    await User.findByIdAndUpdate(note.uploadedBy, {
      $pull: { notes: note._id }
    });

    // Delete note from database
    await Note.findByIdAndDelete(id);

    // Invalidate relevant caches
    await cacheService.invalidateNoteCache(id);

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("DELETE NOTE ERROR >>>", err);
    res.status(500).json({ error: err.message || "Failed to delete note" });
  }
};

const getPendingNotes = async (req, res) => {
  try {
    const notes = await Note.find({ status: 'pending' }).populate("uploadedBy", "name email");
    res.status(200).json(notes);
  } catch (err) {
    console.error("GET PENDING NOTES ERROR >>>", err);
    res.status(500).json({ error: "Failed to fetch pending notes" });
  }
};

const reviewNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { status, adminComment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'approved' or 'rejected'" });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Update note status
    note.status = status;
    if (adminComment) {
      note.adminComment = adminComment;
    }
    note.reviewedAt = new Date();
    note.reviewedBy = req.user._id;

    await note.save();

    // Invalidate relevant caches
    await cacheService.invalidateNoteCache(noteId);

    // Send notification to user (you can implement this later)
    // await sendNotificationToUser(note.uploadedBy, `Your note "${note.title}" has been ${status}`);

    res.status(200).json({
      message: `Note ${status} successfully`,
      note: note
    });
  } catch (err) {
    console.error("REVIEW NOTE ERROR >>>", err);
    res.status(500).json({ error: err.message || "Failed to review note" });
  }
};

const getAllNotesAdmin = async (req, res) => {
  try {
    const { status, subject, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (subject) {
      filter.subject = subject.toLowerCase();
    }

    const skip = (page - 1) * limit;
    
    const notes = await Note.find(filter)
      .populate("uploadedBy", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Note.countDocuments(filter);

    res.status(200).json({
      notes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotes: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error("GET ALL NOTES ADMIN ERROR >>>", err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};

module.exports = {
  getNoteById,
  getAllNotes,
  uploadNote,
  updateNote,
  deleteNote,
  getPendingNotes,
  reviewNote,
  getAllNotesAdmin
};