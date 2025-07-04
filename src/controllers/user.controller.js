const axios = require("axios");
const User = require("../models/User");
const UserInventory = require("../models/UserInventory");
const updateInventoryForUser = require("../utils/updateInventory");

const token = "7643909829:AAGtmiIS3rx9HMR_i-4nx0vq6qBRi627lWs";

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

exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isBlocked = !user.isBlocked;
    await user.save();
    return res.json({
      data: user
    })
  } catch (err) {
    return res.status(500).json({
      message: "Interval server error",
      error: err.message
    })
  }
}

exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const findUser = await User.findById(userId);

    if (!findUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { 
      chat_id: findUser.chatId,
      text: `Sizning akkauntingiz muvaffaqiyatli o‘chirildi.\n\nQayta akkaunt ochish uchun /start buyrug'ini yuboring.`
    });

    axios.post(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
      chat_id: findUser.chatId,
      menu_button: {
        type: "default"
      }
    })

    await UserInventory.deleteMany({ user: userId });

    await User.findByIdAndDelete(userId);
    return res.json({
      message: "User deleted successfully"
    });
  } catch (err) {
    return res.status(500).json({
      message: "Interval server error",
      error: err.message
    })
  }
}
