const axios = require("axios");
require("dotenv").config();
const apiCenter = require("./apiCenter");
const Log = require("../models/logs");
const User = require("../models/user");
const Stock = require("../models/stock");

const instance = () => {
  return axios.create({
    baseURL: `${process.env.KITE_URL}`,
  });
};

const limitOrder = async (
  tradingsymbol,
  transaction_type,
  exchange,
  quantity,
  price,
  api_key,
  access_token
) => {
  try {
    let dataOject = {
      exchange,
      tradingsymbol,
      transaction_type,
      quantity,
      order_type: "LIMIT",
      exchange,
      price,
    };
    if (exchange === "NSE") {
      dataOject["product"] = "CNC";
      dataOject["validity"] = "TTL";
      dataOject["validity_ttl"] = 1;
    } else if (exchange === "NFO") {
      dataOject["product"] = "NRML";
      dataOject["validity"] = "TTL";
      dataOject["validity_ttl"] = 1;
    } else if (exchange === "MCX") {
      dataOject["product"] = "NRML";
      dataOject["validity"] = "DAY";
    } else {
      console.log("Exchange error, value for exchange is " + exchange);
      return "exchange error! chech exchange value";
    }
    // console.log(dataOject);
    const newInstance = instance();
    const response = await newInstance.post("/orders/regular", dataOject, {
      headers: {
        "X-Kite-Version": process.env.KITE_VERSION,
        Authorization: `token ${api_key}:${access_token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response) {
      // console.log(response.data + "*******************************");
      return response.data.data.order_id || "invalid order data";
    }
  } catch (error) {
    console.log("error in placing limit order ");
    console.log(error);
    return { error: "An error occurred while placing order" };
  }
};

const limtOrderForAll = async (transaction_type, stockId, price) => {
  // return res.send("hit");
  try {
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
    let squareOffPromises = [];

    promises = users.map(async (user) => {
      // return res.send(user);
      // const user = await User.findById(user._id);
      const api_key = user.brokerDetail.apiKey;
      const access_token = user.brokerDetail.dailyAccessToken;
      const qty = user.stockDetail.quantity;
      const lotSize = stock.brokerDetail.lotSize;
      let quantity = qty * lotSize;

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

      const orderId = await limitOrder(
        tradingsymbol,
        transaction_type,
        exchange,
        quantity,
        price,
        api_key,
        access_token
      );
      // console.log(orderId + user.name);
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

        if (orderStatus === "COMPLETE" && exchange !== "NSE") {
          if (transaction_type === "BUY" && oldQuantity < 0) {
            let quantity = Math.abs(oldQuantity);
            const squareOffOrderId = await limitOrder(
              tradingsymbol,
              transaction_type,
              exchange,
              quantity,
              price,
              api_key,
              access_token
            );
            if (!squareOffOrderId) {
              responses.push({
                userId: user._id,
                name: user.name,
                error: "squareOffOrderId Id not generated. Error in data.",
              });
              return;
            } else {
              console.log("squareOffOrderId is - " + squareOffOrderId);
              const squareOffOrderStatus = await apiCenter.orderCheckingHandler(
                squareOffOrderId,
                api_key,
                access_token
              );
              console.log(squareOffOrderStatus);
              const time = new Date();
              const newLog = new Log({
                orderId: squareOffOrderId,
                orderStatus: squareOffOrderStatus,
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
                name: user.name,
                squareOffOrderId,
                squareOffOrderStatus,
                quantity,
              });
              squareOffPromises.push(squareOffOrderStatus);
            }
          } else if (transaction_type === "SELL" && oldQuantity > 0) {
            let quantity = Math.abs(oldQuantity);
            const squareOffOrderId = await limitOrder(
              tradingsymbol,
              transaction_type,
              exchange,
              quantity,
              price,
              api_key,
              access_token
            );
            if (!squareOffOrderId) {
              responses.push({
                userId: user._id,
                name: user.name,
                error: "squareOffOrderId Id not generated. Error in data.",
              });
              return;
            } else {
              console.log("squareOffOrderId is - " + squareOffOrderId);
              const squareOffOrderStatus = await apiCenter.orderCheckingHandler(
                squareOffOrderId,
                api_key,
                access_token
              );
              console.log(squareOffOrderStatus);
              const time = new Date();
              const newLog = new Log({
                orderId: squareOffOrderId,
                orderStatus: squareOffOrderStatus,
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
                name: user.name,
                squareOffOrderId,
                squareOffOrderStatus,
                quantity,
              });
              squareOffPromises.push(squareOffOrderStatus);
            }
          }
        }
        responses.push({
          userId: user._id,
          name: user.name,
          orderId,
          orderStatus,
          quantity,
        });
        return orderStatus;
      }
    });

    await Promise.allSettled(promises);
    await Promise.allSettled(squareOffPromises);
    // console.log(promises);
    return responses;
  } catch (error) {
    console.log(error);
    return { error: error.toString() };
  }
};

const updateOrder = async (api_key, access_token, price, orderId) => {
  try {
    const newInstance = instance();
    const response = await newInstance.put(
      `/orders/regular/${orderId}`,
      {
        price,
      },
      {
        headers: {
          "X-Kite-Version": process.env.KITE_VERSION,
          Authorization: `token ${api_key}:${access_token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response) {
      console.log(response.data);
      return response.data || "error while updating order";
    }
  } catch (error) {
    console.log("error in updating order");
    console.log(error);
    return { error: "An error occurred while updating order" };
  }
};

const deleteOrder = async (api_key, access_token, orderId) => {
  try {
    const newInstance = instance();
    const response = await newInstance.delete(`/orders/regular/${orderId}`, {
      headers: {
        "X-Kite-Version": process.env.KITE_VERSION,
        Authorization: `token ${api_key}:${access_token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response) {
      console.log(response.data);
      return response.data || "error in deliting order";
    }
  } catch (error) {
    console.log("error in deliting order");
    console.log(error);
    return { error: "An error occurred while deleting order" };
  }
};

const getOrders = async (api_key, access_token) => {
  try {
    const newInstance = instance();
    const response = await newInstance.get("/orders", {
      headers: {
        "X-Kite-Version": process.env.KITE_VERSION,
        Authorization: `token ${api_key}:${access_token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response) {
      return response.data || "error in fetching order data";
    }
  } catch (error) {
    console.log(error);
    return { error: "An error occurred while getting orders" };
  }
};

module.exports = {
  limitOrder,
  limtOrderForAll,
  updateOrder,
  deleteOrder,
  getOrders,
};
