const axios = require('axios');
const cron = require('node-cron');
const Item = require("../models/Item");

async function getSkinsportPrice() {
  try {
    const url = `https://api.skinport.com/v1/items?currency=USD`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',      
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    const { data } = await axios.get(url, { headers });

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
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
      console.error("Headers:", err.response.headers);
    } else if (err.request) {
      console.error("No response received:", err.request);
    } else {
      console.error("Error setting up request:", err.message);
    }
  }
}

cron.schedule(
  "0 */2 * * *",
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
