const mongoose = require("mongoose");
const User = require("./User");

// Define allowed subjects
const ALLOWED_SUBJECTS = [
  "Java",
  "C++",
  "Web Development",
  "Python",
  "Data Structures",
  "Algorithms"
];

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewComment: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    subject: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return ALLOWED_SUBJECTS.some(subject => 
            subject.toLowerCase() === v.toLowerCase()
          );
        },
        message: props => `${props.value} is not a valid subject. Allowed subjects are: ${ALLOWED_SUBJECTS.join(', ')}`
      }
    },
    fileUrl: {
      type: String,
      required: true
    },
    cloudinaryId: {
      type: String,
      required: true
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
