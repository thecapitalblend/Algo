const apiCenter = require("../utils/apiCenter");


let alarm;

module.exports.healthChecker = async () => {
  try {
    alarm = setInterval(() => {
      if ([1, 2, 3, 4, 5].includes(new Date().getDay())) {
        if (
          (new Date().getHours() === 8 && new Date().getMinutes() > 45) ||
          new Date().getHours() > 8
        ) {
          apiCenter.getCandleData("256265", "minute");
          console.log("health checking");
        }
      }
    }, 200000);
  } catch (error) {
    console.log("error in alarm checker", error);
  }
};

module.exports.silentHandler = (req, res) => {
  clearInterval(alarm);
  console.log("silent handler run");
  setTimeout(() => {
    module.exports.healthChecker();
  }, 30000);
  res.status(200).json("silent handler ran sucessfully");
};
