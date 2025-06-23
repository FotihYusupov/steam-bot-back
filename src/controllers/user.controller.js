const User = require("../models/User");
const UserInventory = require("../models/UserInventory");
const updateInventoryForUser = require("../utils/updateInventory");

exports.getAll = async (req, res) => {
  try {
    const users = await User.find();
    return res.json({
      data: users
    });
  } catch (err) {
    return res.status(500).json({
      message: "Interval server error",
      error: err.message
    })
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.json({
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Interval server error",
      error: err.message
    })
  }
}

exports.getInventory = async (req, res) => {
  try {
    const items = await UserInventory.find({ user: req.user.id });

    return res.json({
      data: items,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Interval server error",
      error: err.message
    })
  }
}

exports.update = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
    return res.json({
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Interval server error",
      error: err.message
    })
  }
}

function extractPartnerIdFromTradeUrl(tradeUrl) {
  const url = new URL(tradeUrl);
  const partnerId = url.searchParams.get("partner");
  if (!partnerId) return null;
  const steamId64 = (BigInt(partnerId) + 76561197960265728n).toString();
  return steamId64;
}

exports.setTradeUrl = async (req, res) => {
  try {
    const steamId64 = extractPartnerIdFromTradeUrl(req.body.tradeUrl);

    const findUser = await User.findById(req.user.id);

    if (!findUser.steamId64) {
      findUser.steamId64 = steamId64;
      await findUser.save();
    }

    await updateInventoryForUser(findUser);

    return res.json({
      data: findUser
    })
  } catch (err) {
    return res.status(500).json({
      message: "Interval server error",
      error: err.message
    })
  }
}

exports.updateInventory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    await updateInventoryForUser(user);

    const items = await UserInventory.find({ user: req.user.id });

    return res.json({
      data: items,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Interval server error",
      error: err.message
    })
  }
}
