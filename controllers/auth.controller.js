const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;
const Sentry = require("../libs/sentry");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      let user = await prisma.user.findFirst({
        where: { email },
      });
      if (!user) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password!",
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: "invalid email or password",
          data: null,
        });
      }

      delete user.password;
    
      let token = jwt.sign(user, JWT_SECRET_KEY);

      const newNotification = await prisma.notification.create({
        data: {
          title: "Notification",
          message: "Login successfully",
          createdAt: formattedDate(new Date()),
          user_id: user.id,
        },
      });

      io.emit(`user-${user.id}`, newNotification);

      return res.status(201).json({
        status: true,
        message: "success",
        data: { ...user, token },
      });
    } catch (error) {
      next(error);
    }
  },

  verified: async (req, res, next) => {
    try {
      return res.status(200).json({
        status: true,
        message: "Success",
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  },

  googleOauth2: (req, res) => {
    let token = jwt.sign({ id: req.user.id }, JWT_SECRET_KEY);

    res.json({
      status: true,
      message: "OK",
      err: null,
      data: { user: req.user, token },
    });
  },
};
