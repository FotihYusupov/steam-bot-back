const mongoose = require("mongoose");

const userInventorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  market_hash_name: String,
  steam_price: Number,
  suggested_price: Number,
  user_price: Number,
  image_url: String,
  assetid: String,
  float_value: Number,
  exterior: String,
  rarity: String,
  expires_at: Date,
  nextAnnounce: Number,
  comment: String,
  messageId: Number,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("UserInventory", userInventorySchema);
