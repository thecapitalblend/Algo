const jwt = require("jsonwebtoken");
require("dotenv").config();

const isAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET);

    if (decodedToken.role === "admin") {
      req.user = {
        id: decodedToken.id,
        role: decodedToken.role,
      };
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

const isUser = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (decodedToken.role === "user" || decodedToken.role === "admin") {
      req.user = {
        id: decodedToken.id,
        role: decodedToken.role,
      };
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

const isManager = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (decodedToken.role === "manager" || decodedToken.role === "admin") {
      req.user = {
        id: decodedToken.id,
        role: decodedToken.role,
      };
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = {
  isAdmin,
  isUser,
  isManager,
};
