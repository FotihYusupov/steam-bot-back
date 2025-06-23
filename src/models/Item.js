const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  market_hash_name: String,
  suggested_price: Number,
  steam_price: Number,
});

module.exports = mongoose.model("Item", itemSchema);
