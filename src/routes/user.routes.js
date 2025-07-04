const { Router } = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");

const userRoutes = Router();

userRoutes.get("/", userController.getAll);
userRoutes.get("/me", authMiddleware, userController.getMe);
userRoutes.get("/inventory", authMiddleware, userController.getInventory);

userRoutes.put("/update-inventory", authMiddleware, userController.updateInventory);
userRoutes.put("/set-trade-url", authMiddleware, userController.setTradeUrl);
userRoutes.put("/", authMiddleware, userController.update);
userRoutes.put("/block/:id", authMiddleware, userController.blockUser);

userRoutes.delete("/", authMiddleware, userController.delete);

module.exports = userRoutes;
