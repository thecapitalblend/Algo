const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../utils/authMiddleware");

const router = express.Router();

router.get(
  "/get-latest-close",
  authMiddleware.isAdmin,
  orderController.getLatestCloseAPI
);
router.get(
  "/get-instruments",
  authMiddleware.isAdmin,
  orderController.getInstrumentsAPI
);

router.get(
  "/get-positions/:id",
  authMiddleware.isUser,
  orderController.getPositionsAPI
);
router.get(
  "/get-orders/:id",
  authMiddleware.isUser,
  orderController.getOrdersAPI
);

router.post(
  "/place-order",
  authMiddleware.isAdmin,
  orderController.placeLimtOrder
);

router.post(
  "/place-order-for-all",
  authMiddleware.isAdmin,
  orderController.placeLimtOrderForAll
);

router.post(
  "/give-quantity-difference",
  authMiddleware.isAdmin,
  orderController.giveQuantityDiff
);


router.post(
  "/neutralise-positions",
  authMiddleware.isAdmin,
  orderController.neutralisePositions
);

router.post(
  "/give-quantity-difference",
  authMiddleware.isAdmin,
  orderController.giveQuantityDiff
);

router.post(
  "/update-order",
  authMiddleware.isAdmin,
  orderController.updateOrderAPI
);

router.post(
  "/delete-order",
  authMiddleware.isAdmin,
  orderController.deleteOrderAPI
);







module.exports = router;
