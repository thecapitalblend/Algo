const User = require("../models/user");
const bcrypt = require("bcrypt");
const KiteConnect = require("kiteconnect").KiteConnect;

exports.changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        password: hashedPassword,
      },
      { new: true }
    ).select(
      "-brokerDetail.clientId -brokerDetail.personalSecret -brokerDetail.dailyAccessToken -password"
    );
    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

module.exports.genSession = async (req, res) => {
  try {
    const foundUser = await User.findById(req.user.id);
    // console.log(foundUser);
    const api_key = foundUser.brokerDetail.apiKey;
    const api_secret = foundUser.brokerDetail.personalSecret;
    const requestToken = req.body.requestToken;
    let daily_access_token = null;
    let enctoken = null;
    if (!api_secret || !api_key) {
      return res.status(500).json({
        message: "api key or personal secret not saved contact admin",
      });
    } else {
      const kc = new KiteConnect({
        api_key: api_key,
      });
      await kc
        .generateSession(requestToken, api_secret)
        .then(function (response) {
          console.log(response);
          daily_access_token = response.access_token;
          enctoken = response.enctoken;
          // init()
        })
        .catch(function (err) {
          console.log(err);
          return res.status(500).json({
            message: "An error occurred redirect and try again to save",
            err,
          });
        });
    }

    if (daily_access_token && enctoken) {
      await User.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            "brokerDetail.dailyAccessToken": daily_access_token,
            "brokerDetail.enctoken": enctoken,
          },
        },
        { new: true }
      );
      res.status(200).json({
        message: "dailyAccessToken saved successfully",
      });
    } else {
      console.log("juni token mokli topa");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.signUp = async (req, res) => {
  try {
    const { name, email, mobileNo, password, clientId } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      mobileNo,
      password: hashedPassword,
      brokerDetail: {
        clientId: clientId,
      },
    });
    const user = await newUser.save();
    res.status(201).json({
      message: "User added successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.editSelf = async (req, res) => {
  try {
    const foundUser = await User.findById(req.user.id);

    const { name, email, mobileNo, stockDetail } = req.body;

    let newStockDetail, newBrokerDetail;

    if (stockDetail) {
      newStockDetail = stockDetail.map((stock) => {
        return {
          stockId: stock.stockId,
          quantity: stock.quantity,
        };
      });
    } else {
      newStockDetail = foundUser.stockDetail;
    }

    if (req.body.brokerDetail) {
      newBrokerDetail = {
        clientId: req.body.brokerDetail.clientId,
      };
    } else {
      newBrokerDetail = foundUser.brokerDetail;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        mobileNo,
        brokerDetail: newBrokerDetail,
        stockDetail: newStockDetail,
      },
      { new: true }
    )
      .populate("stockDetail.stockId")
      .populate("brokerDetail.clientId");

    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

module.exports.getUserCount = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({ userCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};