const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const stockRoutes = require("./routes/stockRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const logRoutes = require("./routes/logRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkRoutes = require("./routes/checkRoutes");
const bodyParser = require("body-parser");
const { healthChecker } = require("./controllers/checkController");
const cron = require("./utils/cron");
const reqMaker = require("./utils/reqMaker");

dotenv.config();

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/stocks";

mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());

// healthChecker()
// cron.scheduleBankNifty()
// cron.scheduleCrudeOilMini()
// cron.scheduleNiftyFifty()
//  cron.scheduleCrudeOilMiniFour();

app.use("/users", userRoutes);
app.use("/stocks", stockRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/logs", logRoutes);
app.use("/orders", orderRoutes);
app.use("/checks", checkRoutes);

reqMaker.sendRequest();
setInterval(reqMaker.sendRequest, 600000);

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT} new line ***********************************************************************************************************************************************************************`
  );
});
