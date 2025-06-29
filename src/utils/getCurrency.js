const Currency = require("../models/Currency");

function getCurrentDate() {
  const now = new Date();
  const day = ("0" + now.getDate()).slice(-2);
  const month = ("0" + (now.getMonth() + 1)).slice(-2);
  const year = now.getFullYear();

  return `${year}-${month}-${day}`;
}

async function findCurrentDate() {
  const findCurrency = await Currency.findOne({
    date: getCurrentDate(),
  }).exec();

  if (!findCurrency) {
    try {
      const today = getCurrentDate();
      const response = await fetch(
        `https://cbu.uz/uz/arkhiv-kursov-valyut/json/all/${today}/`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      const currencyData = data.find((e) => e.Code === "840");

      if (!currencyData) return null;

      const newCurrency = new Currency({
        date: today,
        cb: Number(currencyData.Rate),
      });

      return await newCurrency.save();
    } catch (error) {
      console.error("Error fetching currency data:", error);
      return null;
    }
  }

  return findCurrency;
}

module.exports = findCurrentDate;
