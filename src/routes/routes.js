const { Router } = require("express");
const routes = Router();

routes.use("/users", require("./user.routes"));
routes.use("/giveaways", require("./giveaway.routes"));
routes.use("/user-inventory", require("./userInventory.routes"));

module.exports = routes;
