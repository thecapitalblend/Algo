const mongoose = require("mongoose");

const borkerSchema = new mongoose.Schema({
  instrumentType: {
    type: String,
    required: true,
  },
  tradingSymbol: {
    type: String,
    required: true,
  },
  instrumentToken: {
    type: String,
    required: true,
  },
  lotSize: {
    type: Number,
    required: true,
  },
  exchange: {
    type: String,
    enum: ["NFO", "MCX", "BSE", "NSE"],
  },
  expiryDate: {
    type: Date,
    required: true,
  },
});

const stockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["BUY", "SELL"],
  },
  silverQuantity: {
    type: Number,
    required: true,
  },
  goldQuantity: {
    type: Number,
    required: true,
  },
  marginPoint: {
    type: Number,
  },
  isBuyAllowed: {
    type: Boolean,
    required: true,
  },
  isSellAllowed: {
    type: Boolean,
    required: true,
  },
  isCronStop: {
    type: Boolean,
    required: true,
  },
  isActiveFromAdmin: {
    type: Boolean,
    required: true,
  },
  brokerDetail: borkerSchema,
});

module.exports = mongoose.model("Stock", stockSchema);
