const mongoose = require("mongoose");
const User = require("./User");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to User
    required: true,
  },

  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
