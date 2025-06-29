const axios = require('axios');
const UserInventory = require('../models/UserInventory');
const Item = require('../models/Item');

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://steamcommunity.com/',
  'X-Requested-With': 'XMLHttpRequest',
};

async function updateInventoryForUser(user) {
  if (!user.steamId64) {
    console.log(`ℹ️ User ${user.telegramId} does not have a SteamID64.`);
    return;
  }

  const url = `https://steamcommunity.com/inventory/${user.steamId64}/730/2`;
  console.log(`🔄 Fetching inventory for user ${user.telegramId} from: ${url}`);

  try {
    const { data } = await axios.get(url, { headers });

    if (!data || !data.assets || data.assets.length === 0) {
      console.log(`❌ Inventory is empty or unavailable for user: ${user.telegramId}`);
      await UserInventory.deleteMany({ user: user._id });
      console.log(`🗑️ Cleared all inventory items for user: ${user.telegramId} as their Steam inventory is empty.`);
      return;
    }

    const assets = data.assets;
    const descriptions = data.descriptions;
    const currentAssetIds = new Set();

    for (let asset of assets) {
      const desc = descriptions.find(
        d => d.classid === asset.classid && d.instanceid === asset.instanceid
      );
      if (!desc) {
        console.warn(`⚠️ Description not found for assetid: ${asset.assetid}`);
        continue;
      }

      const name = desc.market_hash_name;
      const assetid = asset.assetid;
      currentAssetIds.add(assetid);

      const item = await Item.findOne({ market_hash_name: name });
      const steam_price = item?.steam_price || null;
      const suggested_price = item?.suggested_price || null;

      const iconPath = desc.icon_url_large || desc.icon_url || null;
      const image_url = iconPath
        ? `https://community.cloudflare.steamstatic.com/economy/image/${iconPath}/360fx360f` // Larger image size
        : null;

      const rarityTag = desc.tags?.find(tag => tag.category === 'Rarity');
      const rarity = rarityTag?.localized_tag_name || null;

      const exteriorTag = desc.tags?.find(tag => tag.category === 'Exterior');
      const exterior = exteriorTag?.localized_tag_name || null;

      const inspectAction = desc.actions?.find(action => action.name.includes('Inspect in Game')); // More specific check
      const inspectLink = inspectAction?.link || null;

      await UserInventory.updateOne(
        {
          user: user._id,
          assetid,
        },
        {
          $set: {
            market_hash_name: name,
            steam_price,
            suggested_price,
            image_url,
            rarity,
            exterior,
            inspectLink,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    await UserInventory.deleteMany({
      user: user._id,
      assetid: { $nin: Array.from(currentAssetIds) },
    });
    console.log(`🗑️ Removed ${await UserInventory.countDocuments({ user: user._id, assetid: { $nin: Array.from(currentAssetIds) } })} stale items for user: ${user.telegramId}.`);

    console.log(`✅ Inventory successfully updated for user: ${user.telegramId}`);
  } catch (err) {
    console.error(`❌ Error fetching or updating inventory for user: ${user.telegramId}`);
    if (err.response) {
      console.error(`Steam API responded with status ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    } else {
      console.error(err.message);
    }
  }
}

module.exports = updateInventoryForUser;
