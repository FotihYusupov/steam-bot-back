const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema({
  title: String,
  desc: String,
  url: String,
  image: String,
});

module.exports = mongoose.model("Giveaway", giveawaySchema);
