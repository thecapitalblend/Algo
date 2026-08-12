const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../utils/authMiddleware");

const router = express.Router();

router.post("/add-user", authMiddleware.isAdmin, adminController.addUser);

router.patch(
  "/reset-password/:Id",
  authMiddleware.isAdmin,
  adminController.resetPassword
);

router.get(
  "/get-all-users",
  authMiddleware.isAdmin,
  adminController.getAllUsers
);

router.get("/is-all-set", authMiddleware.isManager, adminController.isAllSet);

router.get("/get-user/:Id", authMiddleware.isUser, adminController.getUser);

router.patch("/edit-user/:Id", authMiddleware.isUser, adminController.editUser);

router.delete(
  "/delete-user/:Id",
  authMiddleware.isAdmin,
  adminController.deleteUser
);

module.exports = router;
