const User = require("../models/user");
const bcrypt = require("bcrypt");
const apiCenter = require("../utils/apiCenter");

exports.addUser = async (req, res) => {
  try {
    const {
      name,
      email,
      mobileNo,
      password,
      userRole,
      paymentDetail,
      membership,
      managerId,
      isApprovedFromAdmin,
      brokerDetail,
      stockDetail,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      mobileNo,
      password: hashedPassword,
      userRole,
      paymentDetail,
      membership,
      managerId,
      isApprovedFromAdmin,
      brokerDetail,
      stockDetail,
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

exports.getUser = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const user = await User.findById(req.params.Id).select(
        "-brokerDetail.personalSecret -brokerDetail.dailyAccessToken"
      );
      if (!user) {
        return res.status(404).json("No user found!");
      }
      res.status(200).json({
        user,
      });
    } else {
      const user = await User.findById(req.user.id).select(
        "-brokerDetail.personalSecret -brokerDetail.dailyAccessToken"
      );
      if (!user) {
        return res.status(404).json("No user found!");
      }
      res.status(200).json({
        user,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select(
      "-brokerDetail.clientId -brokerDetail.personalSecret -brokerDetail.dailyAccessToken"
    );
    res.status(200).json({
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.editUser = async (req, res) => {
  // return res.send(req.body);

  try {
    const updateFields = { ...req.body };
    if (req.body.brokerDetail) {
      for (let field in req.body.brokerDetail) {
        updateFields[`brokerDetail.${field}`] = req.body.brokerDetail[field];
      }
      delete updateFields.brokerDetail;
    }
    if (req.user.role === "admin") {
      const user = await User.findByIdAndUpdate(req.params.Id, updateFields, {
        new: true,
      });
      if (!user) {
        return res.status(404).json("No user found!");
      }
      res.status(200).json({
        user,
      });
    } else {
      const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
        new: true,
      });
      if (!user) {
        return res.status(404).json("No user found!");
      }
      res.status(200).json({
        user,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const removedType = await User.findByIdAndRemove(req.params.Id);
    if (removedType === null) {
      return res.status(500).json("No user found!");
    }
    res.status(200).json("User Deleted Successfully");
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(
      req.params.Id,
      {
        password: hashedPassword,
      },
      { new: true }
    );
    res.status(200).json("Password changed successfullly.");
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};

exports.isAllSet = async (req, res) => {
  // return res.send("hit");
  try {
    const users = await User.find({
      isApprovedFromAdmin: true,
    }).lean();

    let responses = [];
    let promises = [];

    promises = users.map(async (user) => {
      // return res.send(user);
      const api_key = user.brokerDetail.apiKey;
      const access_token = user.brokerDetail.dailyAccessToken;

      const positions = await apiCenter.getPositions(api_key, access_token);
      if (positions?.error) {
        responses.push({
          userId: user._id,
          name: user.name,
          no: user.mobileNo,
          error: positions.error,
        });
        return;
      }
      responses.push({
        userId: user._id,
        name: user.name,
        no: user.mobileNo,
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