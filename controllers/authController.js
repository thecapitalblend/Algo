const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

require("dotenv").config();

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.SECRET, {
    expiresIn: "1d",
  });
};


exports.loginUser = async (req, res) => {
  try {
  const { email, password } = req.body;
  const user = await User.findOne({ email })
    .select(
      "-brokerDetail.clientId -brokerDetail.personalSecret -brokerDetail.dailyAccessToken"
    )
    .populate("stockDetail");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const token = generateToken(user._id, user.userRole);
  user.password = undefined;

  res.status(200).json({
    message: "User logged in successfully",
    token,
    user,
  });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
};





