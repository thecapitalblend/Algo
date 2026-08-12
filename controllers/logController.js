const Log = require("../models/logs");

exports.addLog = async (req, res) => {
  // return res.send(req.body);
  try {
    const {
      orderId,
      orderStatus,
      userId,
      tradingsymbol,
      time,
      price,
      transaction_type,
      quantity,
    } = req.body;

    const newLog = new Log({
      orderId,
      orderStatus,
      tradingsymbol,
      time,
      price,
      transaction_type,
      userId,
      quantity,
    });

    const log = await newLog.save();
    res.status(201).json({
      message: "Log added successfully",
      log,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.getLogs = async (req, res) => {
  // return res.send(req.query);
  try {
    const { userId, startDate, endDate } = req.query;
    if (!userId || !startDate || !endDate) {
      const allLogs = await Log.find({});
      return res.status(200).json({ allLogs });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const logs = await Log.find({
      userId,
      time: {
        $gte: start,
        $lte: end,
      },
    });
    res.status(200).json({
      logs,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.getUserLogs = async (req, res) => {
  try {
    const userId = req.params.userId;
    const logs = await Log.find({ userId: userId });

    if (!logs) {
      return res.status(404).json({ message: "No logs found for this user." });
    }

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
