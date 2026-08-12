const apiCenter = require("../utils/apiCenter");
const orderFunctions = require("../utils/orderFunctions");
require("dotenv").config();
const Log = require("../models/logs");
const User = require("../models/user");
const Stock = require("../models/stock");

exports.placeLimtOrder = async (req, res) => {
  try {
    const {
      tradingsymbol,
      transaction_type,
      exchange,
      quantity,
      price,
      userId,
    } = req.body;

    const user = await User.findById(userId);
    const api_key = user.brokerDetail.apiKey;
    const access_token = user.brokerDetail.dailyAccessToken;

    // console.log(user, api_key, access_token);

    if (!access_token) {
      return res.status(400).json("No access token found");
    }

    const orderId = await orderFunctions.limitOrder(
      tradingsymbol,
      transaction_type,
      exchange,
      quantity,
      price,
      api_key,
      access_token
    );

    if (!orderId) {
      return res.status(400).json("Order Id not generated. Error in data.");
    } else {
      console.log("orderId is - " + orderId + " - for user - " + user.name);
      const orderStatus = await apiCenter.orderCheckingHandler(
        orderId,
        api_key,
        access_token
      );
      console.log(orderStatus);
      const time = new Date();
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
      await newLog.save();
      quantity;
      res.status(200).json({ newLog });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.toString() });
  }
};

// exports.placeLimtOrderForAll = async (req, res) => {
//   // return res.send("hit");
//   try {
//     const { transaction_type, stockId, price } = req.body;
//     const stock = await Stock.findById(stockId);
//     const exchange = stock.brokerDetail.exchange;
//     const tradingsymbol = stock.brokerDetail.tradingSymbol;

//     const allUsers = await User.find({
//       stockDetail: {
//         $elemMatch: {
//           stockId: stockId,
//           isActive: true,
//         },
//       },
//       isApprovedFromAdmin: true,
//     }).lean();

//     const users = allUsers.map((user) => {
//       const specificStock = user.stockDetail.find((stock) => {
//         return stock.stockId.toString() === stockId;
//       });
//       return { ...user, stockDetail: specificStock };
//     });

//     // return res.send(users);

//     let responses = [];
//     let promises = [];
//     let squareOffPromises = [];

//     promises = users.map(async (user) => {
//       // return res.send(user);
//       // const user = await User.findById(user._id);
//       const api_key = user.brokerDetail.apiKey;
//       const access_token = user.brokerDetail.dailyAccessToken;
//       const qty = user.stockDetail.quantity;
//       const lotSize = stock.brokerDetail.lotSize;
//       let quantity = qty * lotSize;

//       // return res.json({ api_key, access_token, qty, lotSize, quantity });
//       const oldQuantity = await apiCenter.getQuantity(
//         tradingsymbol,
//         api_key,
//         access_token
//       );
//       if (oldQuantity?.error) {
//         responses.push({
//           userId: user._id,
//           name: user.name,
//           error: oldQuantity.error,
//         });
//         return;
//       }

//       // return res.status(200).json(oldQuantity);

//       const orderId = await orderFunctions.limitOrder(
//         tradingsymbol,
//         transaction_type,
//         exchange,
//         quantity,
//         price,
//         api_key,
//         access_token
//       );
//       // console.log(orderId + user.name);
//       if (orderId?.error) {
//         responses.push({
//           userId: user._id,
//           name: user.name,
//           error: "Order Id not generated. Error in data.",
//         });
//         return;
//       }
//       if (!orderId) {
//         responses.push({
//           userId: user._id,
//           name: user.name,
//           error: "Order Id not generated. Error in data.",
//         });
//         return;
//       } else {
//         console.log("orderId is - " + orderId + " - for user - " + user.name);
//         const orderStatus = await apiCenter.orderCheckingHandler(
//           orderId,
//           api_key,
//           access_token
//         );
//         console.log(orderStatus);
//         const time = new Date();
//         const newLog = new Log({
//           orderId,
//           orderStatus,
//           tradingsymbol,
//           time,
//           price,
//           transaction_type,
//           userId: user._id,
//           quantity,
//         });
//         await newLog.save();

//         if (orderStatus === "COMPLETE" && exchange !== "NSE") {
//           if (transaction_type === "BUY" && oldQuantity < 0) {
//             // console.log("this should not run ******************");
//             let quantity = Math.abs(oldQuantity);
//             const squareOffOrderId = await orderFunctions.limitOrder(
//               tradingsymbol,
//               transaction_type,
//               exchange,
//               quantity,
//               price,
//               api_key,
//               access_token
//             );
//             if (!squareOffOrderId) {
//               responses.push({
//                 userId: user._id,
//                 name: user.name,
//                 error: "squareOffOrderId Id not generated. Error in data.",
//               });
//               return;
//             } else {
//               console.log("squareOffOrderId is - " + squareOffOrderId);
//               const squareOffOrderStatus = await apiCenter.orderCheckingHandler(
//                 squareOffOrderId,
//                 api_key,
//                 access_token
//               );
//               console.log(squareOffOrderStatus);
//               const time = new Date();
//               const newLog = new Log({
//                 orderId: squareOffOrderId,
//                 orderStatus: squareOffOrderStatus,
//                 tradingsymbol,
//                 time,
//                 price,
//                 transaction_type,
//                 userId: user._id,
//                 quantity,
//               });
//               await newLog.save();
//               responses.push({
//                 userId: user._id,
//                 name: user.name,
//                 squareOffOrderId,
//                 squareOffOrderStatus,
//                 quantity,
//               });
//               squareOffPromises.push(squareOffOrderStatus);
//             }
//           } else if (transaction_type === "SELL" && oldQuantity > 0) {
//             // console.log("this should not run ******************");
//             let quantity = Math.abs(oldQuantity);
//             const squareOffOrderId = await orderFunctions.limitOrder(
//               tradingsymbol,
//               transaction_type,
//               exchange,
//               quantity,
//               price,
//               api_key,
//               access_token
//             );
//             if (!squareOffOrderId) {
//               responses.push({
//                 userId: user._id,
//                 name: user.name,
//                 error: "squareOffOrderId Id not generated. Error in data.",
//               });
//               return;
//             } else {
//               console.log("squareOffOrderId is - " + squareOffOrderId);
//               const squareOffOrderStatus = await apiCenter.orderCheckingHandler(
//                 squareOffOrderId,
//                 api_key,
//                 access_token
//               );
//               console.log(squareOffOrderStatus);
//               const time = new Date();
//               const newLog = new Log({
//                 orderId: squareOffOrderId,
//                 orderStatus: squareOffOrderStatus,
//                 tradingsymbol,
//                 time,
//                 price,
//                 transaction_type,
//                 userId: user._id,
//                 quantity,
//               });
//               await newLog.save();
//               responses.push({
//                 userId: user._id,
//                 name: user.name,
//                 squareOffOrderId,
//                 squareOffOrderStatus,
//                 quantity,
//               });
//               squareOffPromises.push(squareOffOrderStatus);
//             }
//           }
//         }
//         responses.push({
//           userId: user._id,
//           name: user.name,
//           orderId,
//           orderStatus,
//           quantity,
//         });
//         return orderStatus;
//       }
//     });

//     await Promise.allSettled(promises);
//     await Promise.allSettled(squareOffPromises);
//     // console.log(promises);
//     res.status(200).json({ responses });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: error.toString() });
//   }
// };

exports.placeLimtOrderForAll = async (req, res) => {
  // return res.send("hit");
  try {
    const { transaction_type, stockId, price } = req.body;
    const responses = await orderFunctions.limtOrderForAll(
      transaction_type,
      stockId,
      price
    );
    res.status(200).json({ responses });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.toString() });
  }
};

exports.giveQuantityDiff = async (req, res) => {
  // return res.send("hit");
  try {
    const { stockId } = req.body;
    const stock = await Stock.findById(stockId);
    const tradingsymbol = stock.brokerDetail.tradingSymbol;
    const transaction_type = stock.status;

    const allUsers = await User.find({
      stockDetail: {
        $elemMatch: {
          stockId: stockId,
          isActive: true,
        },
      },
      isApprovedFromAdmin: true,
    }).lean();

    const users = allUsers.map((user) => {
      const specificStock = user.stockDetail.find((stock) => {
        return stock.stockId.toString() === stockId;
      });
      return { ...user, stockDetail: specificStock };
    });

    // return res.send(users);

    let responses = [];
    let promises = [];

    promises = users.map(async (user) => {
      // return res.send(user);
      const api_key = user.brokerDetail.apiKey;
      const access_token = user.brokerDetail.dailyAccessToken;
      const qty = user.stockDetail.quantity;
      const lotSize = stock.brokerDetail.lotSize;
      let quantity = qty * lotSize;
      let desiredQuantity;
      if (transaction_type === "BUY") {
        desiredQuantity = quantity;
      } else if (transaction_type === "SELL") {
        desiredQuantity = quantity * -1;
      }

      // return res.json({ api_key, access_token, qty, lotSize, quantity });
      const actualQuantity = await apiCenter.getQuantity(
        tradingsymbol,
        api_key,
        access_token
      );
      if (actualQuantity?.error) {
        responses.push({
          userId: user._id,
          name: user.name,
          error: actualQuantity.error,
        });
        return;
      }
      responses.push({
        userId: user._id,
        name: user.name,
        desiredQuantity,
        actualQuantity,
      });
    });

    await Promise.allSettled(promises);
    // console.log(promises);
    res.status(200).json({ responses });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.toString() });
  }
};

exports.neutralisePositions = async (req, res) => {
  // return res.send("hit");
  try {
    const { stockId, price } = req.body;
    const stock = await Stock.findById(stockId);
    const exchange = stock.brokerDetail.exchange;
    const tradingsymbol = stock.brokerDetail.tradingSymbol;

    const allUsers = await User.find({
      stockDetail: {
        $elemMatch: {
          stockId: stockId,
          isActive: true,
        },
      },
      isApprovedFromAdmin: true,
    }).lean();

    const users = allUsers.map((user) => {
      const specificStock = user.stockDetail.find((stock) => {
        return stock.stockId.toString() === stockId;
      });
      return { ...user, stockDetail: specificStock };
    });

    // return res.send(users);

    let responses = [];
    let promises = [];

    promises = users.map(async (user) => {
      // return res.send(user);
      const api_key = user.brokerDetail.apiKey;
      const access_token = user.brokerDetail.dailyAccessToken;

      // return res.json({ api_key, access_token, qty, lotSize, quantity });
      const oldQuantity = await apiCenter.getQuantity(
        tradingsymbol,
        api_key,
        access_token
      );
      if (oldQuantity?.error) {
        responses.push({
          userId: user._id,
          name: user.name,
          error: oldQuantity.error,
        });
        return;
      }

      // return res.status(200).json(oldQuantity);

      if (oldQuantity > 0) {
        let transaction_type = "SELL";
        let quantity = Math.abs(oldQuantity);
        const orderId = await orderFunctions.limitOrder(
          tradingsymbol,
          transaction_type,
          exchange,
          quantity,
          price,
          api_key,
          access_token
        );

        if (orderId?.error) {
          responses.push({
            userId: user._id,
            name: user.name,
            error: "Order Id not generated. Error in data.",
          });
          return;
        }
        if (!orderId) {
          responses.push({
            userId: user._id,
            name: user.name,
            error: "Order Id not generated. Error in data.",
          });
          return;
        } else {
          console.log("orderId is - " + orderId + " - for user - " + user.name);
          const orderStatus = await apiCenter.orderCheckingHandler(
            orderId,
            api_key,
            access_token
          );
          console.log(orderStatus);
          const time = new Date();
          const newLog = new Log({
            orderId,
            orderStatus,
            tradingsymbol,
            time,
            price,
            transaction_type,
            userId: user._id,
            quantity,
          });
          await newLog.save();
          responses.push({
            userId: user._id,
            name:user.name,
            orderId,
            orderStatus,
            quantity,
          });
          return orderStatus;
        }
      } else if (oldQuantity < 0) {
        let transaction_type = "BUY";
        let quantity = Math.abs(oldQuantity);
        const orderId = await orderFunctions.limitOrder(
          tradingsymbol,
          transaction_type,
          exchange,
          quantity,
          price,
          api_key,
          access_token
        );

        if (orderId?.error) {
          responses.push({
            userId: user._id,
            name: user.name,
            error: "Order Id not generated. Error in data.",
          });
          return;
        }
        if (!orderId) {
          responses.push({
            userId: user._id,
            name: user.name,
            error: "Order Id not generated. Error in data.",
          });
          return;
        } else {
          console.log("orderId is - " + orderId + " - for user - " + user.name);
          const orderStatus = await apiCenter.orderCheckingHandler(
            orderId,
            api_key,
            access_token
          );
          console.log(orderStatus);
          const time = new Date();
          const newLog = new Log({
            orderId,
            orderStatus,
            tradingsymbol,
            time,
            price,
            transaction_type,
            userId: user._id,
            quantity,
          });
          await newLog.save();
          responses.push({
            userId: user._id,
            name:user.name,
            orderId,
            orderStatus,
            quantity,
          });
          return orderStatus;
        }
      }
    });

    await Promise.allSettled(promises);
    // console.log(promises);
    res.status(200).json({ responses });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.toString() });
  }
};

exports.updateOrderAPI = async (req, res) => {
  try {
    const { orderId, userId, price } = req.body;
    const user = await User.findById(userId);
    const api_key = user.brokerDetail.apiKey;
    const access_token = user.brokerDetail.dailyAccessToken;

    if (!api_key || !access_token || !price || !orderId) {
      return res.status(500).json({
        message: "api_key or price or accessToken or orderId is missing.",
      });
    }
    const response = await orderFunctions.updateOrder(
      api_key,
      access_token,
      price,
      orderId
    );
    if (response?.error) {
      return res.status(500).json({
        message: response.error,
      });
    }
    if (response) {
      res.status(200).json({ response });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred while updating the order.",
      error,
    });
  }
};

exports.deleteOrderAPI = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    const user = await User.findById(userId);
    const api_key = user.brokerDetail.apiKey;
    const access_token = user.brokerDetail.dailyAccessToken;

    if (!api_key || !access_token || !orderId) {
      return res.status(500).json({
        message: "api_key or accessToken or orderId is missing.",
      });
    }
    const response = await orderFunctions.deleteOrder(
      api_key,
      access_token,
      orderId
    );
    if (response?.error) {
      return res.status(500).json({
        message: response.error,
      });
    }
    if (response) {
      res.status(200).json({ response });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred while deleting the order.",
      error,
    });
  }
};

exports.getOrdersAPI = async (req, res) => {
  // return res.send("hit");
  try {
    let user;
    if (req.user.role === "admin") {
      user = await User.findById(req.params.id);
    } else {
      user = await User.findById(req.user.id);
    }
    const api_key = user.brokerDetail.apiKey;
    const access_token = user.brokerDetail.dailyAccessToken;
    if (!api_key || !access_token) {
      return res.status(500).json({
        message: "api_key or accessToken is missing.",
      });
    }
    const response = await orderFunctions.getOrders(api_key, access_token);
    if (response?.error) {
      return res.status(500).json({
        message: response.error,
      });
    }
    if (response) {
      res.status(200).json({ response });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred while getting the orders.",
      error,
    });
  }
};

exports.getPositionsAPI = async (req, res) => {
  try {
    let user;
    if (req.user.role === "admin") {
      user = await User.findById(req.params.id);
    } else {
      user = await User.findById(req.user.id);
    }
    const api_key = user.brokerDetail.apiKey;
    const access_token = user.brokerDetail.dailyAccessToken;
    if (!api_key || !access_token) {
      return res.status(500).json({
        message: "api_key or accessToken is missing.",
      });
    }
    const response = await apiCenter.getPositions(api_key, access_token);
    if (response?.error) {
      return res.status(500).json({
        message: response.error,
      });
    }
    if (response) {
      res.status(200).json({ response });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred in getting the positions.",
      error,
    });
  }
};

exports.getLatestCloseAPI = async (req, res) => {
  try {
    const inst_token = req.query.inst_token;
    if (!inst_token) {
      return res.status(400).json("Inst_token reqired");
    }
    const price = await apiCenter.getLatestClose(inst_token);
    res.status(200).json({ price });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.getInstrumentsAPI = async (req, res) => {
  try {
    const instruments = await apiCenter.getInstruments();
    res.status(200).json(instruments);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};
