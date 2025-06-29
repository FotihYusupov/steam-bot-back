const { Router } = require("express");
const userInventoryController = require("../controllers/userInventory.controller");

const userInventoryRoutes = Router();

userInventoryRoutes.post("/:id", userInventoryController.sendToTelegram);

module.exports = userInventoryRoutes;