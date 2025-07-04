const { Router } = require("express");
const userInventoryController = require("../controllers/userInventory.controller");

const userInventoryRoutes = Router();

userInventoryRoutes.post("/:id", userInventoryController.sendToTelegram);
userInventoryRoutes.put("/:id", userInventoryController.updatedTelegramMessage);
userInventoryRoutes.delete("/:id", userInventoryController.deleteTelegramMessage);

module.exports = userInventoryRoutes;