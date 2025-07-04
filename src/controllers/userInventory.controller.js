const axios = require("axios");
const UserInventory = require("../models/UserInventory");
const findCurrency = require("../utils/getCurrency");

const token = "7643909829:AAGtmiIS3rx9HMR_i-4nx0vq6qBRi627lWs";

function generateHashtagsFromSkinName(skinName) {
  if (!skinName || typeof skinName !== "string") return [];

  const hashtags = new Set();

  const weaponMatch = skinName.match(/^([\w\-]+)/);
  if (weaponMatch) {
    const weapon = weaponMatch[1].replace(/-/g, "");
    hashtags.add(`#${weapon.toUpperCase()}`);
  }

  const skinNameOnly = skinName
    .replace(/^([\w\-]+)\s*\|\s*/, "")
    .replace(/\s*\(([^)]+)\)$/, "")
    .trim();

  skinNameOnly.split(/\s+/).forEach((word) => {
    if (word.length > 2) {
      hashtags.add(`#${word.replace(/[^a-zA-Z0-9]/g, "")}`);
    }
  });

  const exteriorMap = {
    "Factory New": "FN",
    "Minimal Wear": "MW",
    "Field-Tested": "FT",
    "Well-Worn": "WW",
    "Battle-Scarred": "BS",
  };

  const exteriorMatch = skinName.match(/\(([^)]+)\)$/);
  if (exteriorMatch) {
    const full = exteriorMatch[1];
    const short = exteriorMap[full];
    if (short) hashtags.add(`#${short}`);
  }

  hashtags.add("#CS2");
  hashtags.add("#Skin");
  hashtags.add("#Trade");

  return Array.from(hashtags);
}

function roundToNearestMultiple(number, roundTo = 100) {
  return Math.round(number / roundTo) * roundTo;
}

function getInterest(value) {
  if (value < 2) {
    return 15;
  } else {
    return 0;
  }
}

function escapeMarkdown(text) {
  return text?.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, "\\$&");
}

exports.sendToTelegram = async (req, res) => {
  try {
    const findItem = await UserInventory.findById(req.params.id).populate(
      "user"
    );

    if (!findItem) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const steamPriceInUSD = parseFloat(req.body.price);
    findItem.user_price = req.body.price;
    findItem.comment = req.body.comment;
    const todaysCurrency = await findCurrency();
    const uzsPriceRaw =
      (steamPriceInUSD / 100) * getInterest(steamPriceInUSD) +
      steamPriceInUSD * todaysCurrency.cb;

    const finalUzsPrice =
      uzsPriceRaw < 3000 ? 3000 : roundToNearestMultiple(uzsPriceRaw, 100);

    const itemPrice = req.body.isFree
      ? "Bepul"
      : finalUzsPrice?.toLocaleString() + " so'm";

    const text = `
🎮 *${findItem.market_hash_name}*

💰 Narxi: *${escapeMarkdown(itemPrice)}*
🧑‍💼 Sotuvchi: *@${findItem?.user?.username || "Noma’lum"}*

${findItem.exterior ? `🎭 Float: *${escapeMarkdown(findItem.exterior)}*` : ""}
${findItem.rarity ? `💎 Toifa: *${escapeMarkdown(findItem.rarity)}*` : ""}

${req.body.comment ? `📝 Izoh: ${req.body.comment}` : ""}

📣 Kanalga obuna bo'ling:
*@skinChanger_official*

📤 E'lon joylashtirish:
@steamInvertoryHelper\\_bot 

📌 Eng zo‘r skinni hoziroq qo‘lga kiriting!
${generateHashtagsFromSkinName(findItem.market_hash_name).join(" ")}
        `;

    try {
      const res = await axios.post(
        `https://api.telegram.org/bot${token}/sendPhoto`,
        {
          chat_id: -1002660927986,
          photo: findItem.image_url,
          caption: text,
          parse_mode: "Markdown",
        }
      );
      if (res.data.ok) {
        findItem.messageId = res.data.result.message_id;
        await findItem.save();
      }
    } catch (error) {
      console.error(
        "Error sending message to Telegram:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        return res.status(401).json({
          message:
            "Telegram bot token is unauthorized. Please check your token.",
          error: error.message,
        });
      }
      return res.status(500).json({
        message: "Failed to send message to Telegram.",
        error: error.message,
      });
    }

    findItem.nextAnnounce = Date.now() + 3 * 60 * 60 * 1000;
    await findItem.save();

    return res.json({
      data: findItem,
    });
  } catch (err) {
    console.error("General server error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.updatedTelegramMessage = async (req, res) => {
  try {
    const findItem = await UserInventory.findById(req.params.id).populate(
      "user"
    );

    if (!findItem) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const steamPriceInUSD = parseFloat(req.body.price || findItem.user_price);
    const comment = req.body.comment || findItem.comment;
    const todaysCurrency = await findCurrency();
    const uzsPriceRaw =
      (steamPriceInUSD / 100) * getInterest(steamPriceInUSD) +
      steamPriceInUSD * todaysCurrency.cb;

    const finalUzsPrice =
      uzsPriceRaw < 3000 ? 3000 : roundToNearestMultiple(uzsPriceRaw, 100);

    const itemPrice = req.body.isFree
      ? "Bepul"
      : finalUzsPrice?.toLocaleString() + " so'm";

    const text = `
🎮 *${findItem.market_hash_name}*

💰 Narxi: *${escapeMarkdown(itemPrice)}*
🧑‍💼 Sotuvchi: *@${findItem?.user?.username || "Noma’lum"}*

${findItem.exterior ? `🎭 Float: *${escapeMarkdown(findItem.exterior)}*` : ""}
${findItem.rarity ? `💎 Toifa: *${escapeMarkdown(findItem.rarity)}*` : ""}

${comment ? `📝 Izoh: ${comment}` : ""}

📣 Kanalga obuna bo'ling:
*@skinChanger_official*

📤 E'lon joylashtirish:
@steamInvertoryHelper\\_bot 

📌 Eng zo‘r skinni hoziroq qo‘lga kiriting!
${generateHashtagsFromSkinName(findItem.market_hash_name).join(" ")}
  `;

    try {
      let telegramRes;

      if (findItem.messageId) {
        // 🔁 E'lon mavjud – caption yangilanadi
        telegramRes = await axios.post(
          `https://api.telegram.org/bot${token}/editMessageCaption`,
          {
            chat_id: -1002660927986,
            message_id: findItem.messageId,
            caption: text,
            parse_mode: "Markdown",
          }
        );
      } else {
        // 🆕 Yangi e'lon yuboriladi
        telegramRes = await axios.post(
          `https://api.telegram.org/bot${token}/sendPhoto`,
          {
            chat_id: -1002660927986,
            photo: findItem.image_url,
            caption: text,
            parse_mode: "Markdown",
          }
        );

        if (telegramRes.data.ok) {
          findItem.messageId = telegramRes.data.result.message_id;
        }
      }

      if (!telegramRes.data.ok) {
        throw new Error("Telegram returned a failure.");
      }
    } catch (error) {
      console.error(
        "Error sending or editing message on Telegram:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        return res.status(401).json({
          message:
            "Telegram bot token is unauthorized. Please check your token.",
          error: error.message,
        });
      }
      return res.status(500).json({
        message: "Failed to send or edit message on Telegram.",
        error: error.message,
      });
    }

    findItem.user_price = steamPriceInUSD;
    findItem.comment = comment;
    findItem.nextAnnounce = Date.now() + 3 * 60 * 60 * 1000;
    await findItem.save();

    return res.json({
      data: findItem,
    });
  } catch (err) {
    console.error("General server error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.deleteTelegramMessage = async (req, res) => {
  try {
    const findItem = await UserInventory.findById(req.params.id).populate(
      "user"
    );

    if (!findItem) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    try {
      const res = await axios.post(
        `https://api.telegram.org/bot${token}/deleteMessage`,
        {
          chat_id: -1002660927986,
          message_id: findItem.messageId,
        }
      );
      if (res.data.ok) {
        findItem.messageId = null;
        await findItem.save();
      }
    } catch (error) {
      console.error(
        "Error sending message to Telegram:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        return res.status(401).json({
          message:
            "Telegram bot token is unauthorized. Please check your token.",
          error: error.message,
        });
      }
      return res.status(500).json({
        message: "Failed to send message to Telegram.",
        error: error.message,
      });
    }

    return res.json({
      data: findItem,
    });
  } catch (err) {
    console.error("General server error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
