const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  orderStatus: {
    type: String,
    required: true,
  },
  tradingsymbol: {
    type: String,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  time: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  transaction_type: {
    type: String,
    required: true,
    enum: ["BUY", "SELL"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Log", logSchema);
