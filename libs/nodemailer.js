require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,GOOGLE_SENDER_EMAIL, refreshToken } = process.env;
const ejs = require("ejs");

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: refreshToken });

module.exports = {
  sendMail: async (to, subject, html) => {
    try {
      console.log("Getting access token...");
      const accessToken = await oauth2Client.getAccessToken();
      console.log("Access token obtained:", accessToken);

      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: GOOGLE_SENDER_EMAIL,
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          refreshToken: refreshToken,
          accessToken: accessToken.token,
        },
      });

      console.log("Sending email...");
      await transport.sendMail({
        to,
        subject,
        html,
      });
      console.log("Email sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      throw err;
    }
  },

  getHTML: (filename, data) => {
    return new Promise((resolve, reject) => {
      const path = `${__dirname}/../views/templates/${filename}`;

      ejs.renderFile(path, data, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  },
};
