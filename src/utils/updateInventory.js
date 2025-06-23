const axios = require('axios');
const UserInventory = require('../models/UserInventory');
const Item = require('../models/Item');

// Browserga o‘xshash headerlar
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://steamcommunity.com/',
  'X-Requested-With': 'XMLHttpRequest',
};

async function updateInventoryForUser(user) {
  if (!user.steamId64) return;

  // ✅ Yangi formatdagi Steam inventory API URL
  const url = `https://steamcommunity.com/inventory/${user.steamId64}/730/2`;

  console.log(`Yuklanmoqda: ${url}`);

  try {
    const { data } = await axios.get(url, { headers });

    if (!data || !data.assets || data.assets.length === 0) {
      console.log(`❌ Inventory bo‘sh yoki mavjud emas: ${user.telegramId}`);
      return;
    }

    const assets = data.assets;
    const descriptions = data.descriptions;

    // Eski inventory ma'lumotlarini tozalash
    await UserInventory.deleteMany({ user: user._id });

    for (let asset of assets) {
      const desc = descriptions.find(
        d => d.classid === asset.classid && d.instanceid === asset.instanceid
      );
      if (!desc) continue;

      const name = desc.market_hash_name;

      // Mahsulot narxini bazadan olish
      const item = await Item.findOne({ market_hash_name: name });
      const steam_price = item?.steam_price || null;
      const suggested_price = item?.suggested_price || null;

      const iconPath = desc.icon_url || desc.icon_url_large || null;
      const image_url = iconPath
        ? `https://community.cloudflare.steamstatic.com/economy/image/${iconPath}/330x192`
        : null;

      // Inventory bazaga yoziladi
      await UserInventory.create({
        user: user._id,
        market_hash_name: name,
        steam_price,
        suggested_price,
        image_url,
      });
    }

    console.log(`✅ Inventory muvaffaqiyatli yangilandi: ${user.telegramId}`);
  } catch (err) {
    console.error(`❌ Inventory olishda xatolik: ${user.telegramId}`);
    console.error(err.response?.status, err.response?.data || err.message);
  }
}

module.exports = updateInventoryForUser;
