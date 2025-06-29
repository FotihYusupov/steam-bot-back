const { Router } = require("express");
const giveawayController = require("../controllers/giveaway.controller");

const giveawayRoutes = Router();

giveawayRoutes.get("/", giveawayController.getAll);
giveawayRoutes.post("/", giveawayController.create);

module.exports = giveawayRoutes;
