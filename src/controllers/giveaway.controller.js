const Giveaway = require("../models/Giveaway");

exports.getAll = async (req, res) => {
  const giveaways = await Giveaway.find();
  return res.json({
    data: giveaways
  });
}

exports.create = async (req, res) => {
  const giveaway = await Giveaway.create(req.body);
  return res.json({
    data: giveaway
  });
}