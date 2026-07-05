const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const cacheService = require('../utils/cache');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Log the incoming file details for debugging
        console.log("Incoming file details:", {
            mimetype: file.mimetype,
            originalname: file.originalname,
            fieldname: file.fieldname
        });

        // Check if the file is an image
        if (!file.mimetype.startsWith('image/')) {
            console.log("Invalid file type:", file.mimetype);
            return cb(new Error("Only image files are allowed"));
        }

        // Accept common image formats
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.log("Unsupported image type:", file.mimetype);
            cb(new Error(`Unsupported image type. Allowed types: ${allowedTypes.join(', ')}`));
        }
    }
});

// Generate hash for image buffer to use as cache key
const generateImageHash = (buffer) => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};

const performOCR = async (req, res) => {
    try {
        console.log("OCR request received");
        console.log("Request body:", req.body);
        console.log("Request file:", req.file);
        
        if (!req.file) {
            console.log("No file in request");
            return res.status(400).json({ error: "No image file provided" });
        }

        // Generate hash for the image to use as cache key
        const imageHash = generateImageHash(req.file.buffer);
        console.log("Image hash:", imageHash);

        // Check cache first
        const cachedResult = await cacheService.getCachedOCRResult(imageHash);
        if (cachedResult) {
            console.log(`📦 Cache hit for OCR result: ${imageHash}`);
            return res.json({
                ...cachedResult,
                _cached: true,
                _cachedAt: new Date().toISOString()
            });
        }

        console.log("Processing image with OCR.space API...");
        console.log("File details:", {
            mimetype: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer ? "Buffer present" : "No buffer"
        });

        // Create form data for OCR.space API
        const formData = new FormData();
        formData.append('apikey', process.env.OCR_SPACE_API_KEY);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('OCREngine', '2'); // Use OCR Engine 2 for better handwriting recognition
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // Make request to OCR.space API
        const response = await axios.post('https://api.ocr.space/parse/image', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log("OCR.space API response:", response.data);

        if (response.data.IsErroredOnProcessing) {
            throw new Error(response.data.ErrorMessage || 'OCR processing failed');
        }

        if (!response.data.ParsedResults || response.data.ParsedResults.length === 0) {
            return res.status(400).json({
                error: "No text detected in image",
                details: "The image might be unclear or contain no readable text"
            });
        }

        // Extract text and confidence from the first result
        const result = response.data.ParsedResults[0];
        const text = result.ParsedText.trim();
        const confidence = result.TextOverlay ? result.TextOverlay.MeanConfidence : null;

        if (!text || text.length < 2) {
            return res.status(400).json({
                error: "No valid text detected in image",
                details: "The image might be unclear or contain no readable text"
            });
        }

        console.log("OCR Results:", text);
        console.log("Confidence:", confidence);

        const ocrResult = {
            text: text,
            confidence: confidence,
            language: 'eng',
            warning: confidence && confidence < 30 ? "Low confidence in text recognition" : undefined,
            processedAt: new Date().toISOString()
        };

        // Cache the OCR result
        await cacheService.cacheOCRResult(imageHash, ocrResult);

        res.json(ocrResult);

    } catch (error) {
        console.error("OCR processing error:", error);
        console.error("Error stack:", error.stack);
        
        // Send a more detailed error response
        res.status(500).json({
            error: "Failed to process image",
            details: error.message || "Unknown error occurred",
            type: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Batch OCR processing with caching
const performBatchOCR = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No image files provided" });
        }

        if (req.files.length > 5) {
            return res.status(400).json({ error: "Maximum 5 images allowed per batch" });
        }

        const results = [];
        const uncachedImages = [];

        // Check cache for all images first
        for (const file of req.files) {
            const imageHash = generateImageHash(file.buffer);
            const cachedResult = await cacheService.getCachedOCRResult(imageHash);
            
            if (cachedResult) {
                console.log(`📦 Cache hit for batch OCR: ${imageHash}`);
                results.push({
                    filename: file.originalname,
                    ...cachedResult,
                    _cached: true
                });
            } else {
                uncachedImages.push({ file, imageHash });
            }
        }

        // Process uncached images
        for (const { file, imageHash } of uncachedImages) {
            try {
                const formData = new FormData();
                formData.append('apikey', process.env.OCR_SPACE_API_KEY);
                formData.append('language', 'eng');
                formData.append('isOverlayRequired', 'false');
                formData.append('OCREngine', '2');
                formData.append('file', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });

                const response = await axios.post('https://api.ocr.space/parse/image', formData, {
                    headers: {
                        ...formData.getHeaders(),
                    },
                });

                if (response.data.IsErroredOnProcessing) {
                    results.push({
                        filename: file.originalname,
                        error: response.data.ErrorMessage || 'OCR processing failed'
                    });
                    continue;
                }

                if (!response.data.ParsedResults || response.data.ParsedResults.length === 0) {
                    results.push({
                        filename: file.originalname,
                        error: "No text detected in image"
                    });
                    continue;
                }

                const result = response.data.ParsedResults[0];
                const text = result.ParsedText.trim();
                const confidence = result.TextOverlay ? result.TextOverlay.MeanConfidence : null;

                const ocrResult = {
                    filename: file.originalname,
                    text: text,
                    confidence: confidence,
                    language: 'eng',
                    warning: confidence && confidence < 30 ? "Low confidence in text recognition" : undefined,
                    processedAt: new Date().toISOString()
                };

                // Cache the result
                await cacheService.cacheOCRResult(imageHash, ocrResult);

                results.push(ocrResult);

            } catch (error) {
                console.error(`Error processing ${file.originalname}:`, error);
                results.push({
                    filename: file.originalname,
                    error: error.message || "Failed to process image"
                });
            }
        }

        res.json({
            results,
            total: results.length,
            cached: results.filter(r => r._cached).length,
            processed: results.filter(r => !r._cached && !r.error).length,
            errors: results.filter(r => r.error).length
        });

    } catch (error) {
        console.error("Batch OCR processing error:", error);
        res.status(500).json({
            error: "Failed to process batch images",
            details: error.message
        });
    }
};

module.exports = {
    upload,
    performOCR,
    performBatchOCR
}; 