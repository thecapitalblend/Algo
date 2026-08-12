require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MY_MAIL_HOST,
  port: process.env.MY_MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MY_MAIL_USER_ID, // Your Outlook email address
    pass: process.env.MY_MAIL_PASS, // Your Outlook email password
  },
});

module.exports.sendMail = (msg) => {
  const mailOptions = {
    from: process.env.MY_FORM_MAIL,
    to: process.env.KEVAL_MAIL_ID,
    subject: "ALGO NoTIFICATION",
    text: msg,
  };
  setTimeout(() => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  }, 1000);
};

module.exports.sendMailToJadeja = (msg) => {
  const mailOptions = {
    from: process.env.MY_FORM_MAIL,
    to: process.env.JADEJA_MAIL_ID,
    subject: "ALGO NoTIFICATION",
    text: msg,
  };
  setTimeout(() => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  }, 10000);
};
