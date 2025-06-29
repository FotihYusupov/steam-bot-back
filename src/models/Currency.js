const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema({
  date: String,
  cb: Number
});

module.exports = mongoose.model("Currency", currencySchema);
