const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: { 
    type: Number,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    required: false
  },
  phoneNumber: {
    type: String,
    unique: true,
  },
  steamId64: {
    type: String,
    unique: true,
    required: false
  },
  photo: {
    type: String,
    required: false
  },
  chatId: {
    type: Number,
    required: false
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("User", userSchema);
