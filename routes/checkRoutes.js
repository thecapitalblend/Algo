const express = require("express");
const checkController = require("../controllers/checkController");

const router = express.Router();

router.get("/health-check", checkController.healthChecker);
router.get("/silent-handler", checkController.silentHandler);

module.exports = router;
