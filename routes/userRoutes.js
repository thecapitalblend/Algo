const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../utils/authMiddleware");

const router = express.Router();

router.patch("/change-password/:Id",authMiddleware.isUser, userController.changePassword);
router.post("/gen-session", authMiddleware.isUser, userController.genSession);
router.post("/sign-up", userController.signUp);
router.patch("/edit-self/", authMiddleware.isUser, userController.editSelf);
router.get("/get-user-count", userController.getUserCount);

module.exports = router;
