const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection
cloudinary.api.ping()
  .then(() => console.log('Cloudinary connection successful'))
  .catch(err => {
    console.error('Cloudinary connection error:', err);
    process.exit(1);
  });

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "notora",
    allowed_formats: ["pdf", "docx", "txt"],
    resource_type: "raw",
    public_id: (req, file) => {
      // Remove file extension and special characters
      const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
      return `${Date.now()}-${name}`;
    },
  },
});

// Add error handling for storage
storage._handleFile = async function _handleFile(req, file, cb) {
  try {
    const result = await this.cloudinary.uploader.upload_stream({
      folder: this.params.folder,
      resource_type: this.params.resource_type,
      public_id: this.params.public_id(req, file),
      allowed_formats: this.params.allowed_formats,
    }).end(file.buffer);
    
    cb(null, {
      filename: result.public_id,
      path: result.secure_url,
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    cb(new Error('Failed to upload file to Cloudinary'));
  }
};

module.exports = { cloudinary, storage };
