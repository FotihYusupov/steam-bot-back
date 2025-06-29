const cron = require("node-cron");
const axios = require('axios');
const Item = require("../models/Item");

async function getSkinsportPrice() {
  try {
    const url = `https://api.skinport.com/v1/items?currency=USD`;
    const { data } = await axios.get(url);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      const existingItem = await Item.findOne({ market_hash_name: item.market_hash_name });

      const suggestedPrice = item.suggested_price ?? null;
      const steamPrice = item.median_price ?? null;

      if (existingItem) {
        if (suggestedPrice !== null) {
          existingItem.suggested_price = suggestedPrice;
        }

        if (steamPrice !== null) {
          existingItem.steam_price = steamPrice;
        }

        await existingItem.save();
      } else {
        const newItem = new Item({
          market_hash_name: item.market_hash_name,
          suggested_price: suggestedPrice,
          steam_price: steamPrice,
        });
        await newItem.save();
      }
    }
  } catch (err) {
    console.error("Error fetching or saving item prices:", err);
  }
}

cron.schedule(
  "0 */4 * * *",
  () => {
    console.log("Starting get skinsport prices...");
    getSkinsportPrice();
    console.log("Finished get skinsport prices...");
  },
  {
    scheduled: true,
    timezone: "Asia/Tashkent",
  }
);
