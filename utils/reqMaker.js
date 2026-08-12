const axios = require("axios");

exports.sendRequest = async () => {
  try {
    const response = await axios.get("https://request-maker.onrender.com");
    console.log(`Status: ${response.status}`);
    console.log("Body: ", response.data);
  } catch (err) {
    console.error(err);
  }
};
