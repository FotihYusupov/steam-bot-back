const { Router } = require("express");
const routes = Router();

routes.use("/users", require("./user.routes"));

module.exports = routes;
