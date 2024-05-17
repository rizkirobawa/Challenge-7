const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;
const path = require("path");
const nodemailer = require("../libs/nodemailer");
const { getHTML, sendMail } = require("../libs/nodemailer");
const Sentry = require("../libs/sentry");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  register: async (req, res, next) => {
    try {
      let { id } = Number(req.params.id);
      let { first_name, last_name, email, password } = req.body;

      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
          status: false,
          message: "Input must be required!",
        });
      }

      let exist = await prisma.user.findUnique({
        where: { email },
      });

      if (exist) {
        return res.status(401).json({
          status: false,
          message: "Email already used!",
        });
      }
      let encryptedPassword = await bcrypt.hash(password, 10);
      let user = await prisma.user.create({
        data: {
          first_name,
          last_name,
          email,
          password: encryptedPassword,
        },
      });
      delete user.password;

      const newNotification = await prisma.notification.create({
        data: {
          title: "Notification",
          message: "Account has been created successfully",
          createdAt: formattedDate(new Date()),
          user_id: user.id,
        },
      });

      io.emit(`user-${user.id}`, newNotification);

      res.status(200).json({
        status: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  index: async (req, res, next) => {
    try {
      const { search } = req.query;

      const users = await prisma.user.findMany({
        where: { first_name: { contains: search, mode: "insensitive" } },
      });

      users.map((user) => {
        delete user.password;
      });

      res.status(200).json({
        status: true,
        message: "OK",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      let id = Number(req.params.id);

      const users = await prisma.user.findUnique({
        where: { id: id },
      });

      if (!users) {
        return res.status(404).json({
          status: false,
          message: `Can't find user with ID ${id}`,
          data: null,
        });
      }

      delete users.password;

      res.status(200).json({
        status: true,
        message: "OK",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      let { email } = req.body;
      const findUser = await prisma.user.findUnique({ where: { email } });

      if (!findUser) {
        return res.status(404).json({
          status: false,
          message: "Email not found",
        });
      }

      const token = jwt.sign({ email: findUser.email }, JWT_SECRET_KEY);

      const html = await nodemailer.getHTML("email-reset-password.ejs", {
        name: findUser.first_name,
        url: `${req.protocol}://${req.get(
          "host"
        )}/api/v1/reset-password?token=${token}`,
      });

      try {
        await nodemailer.sendMail(email, "Email Forget Password", html);
        return res.status(200).json({
          status: true,
          message: "Success Send Email Forget Password",
        });
      } catch (error) {
        return res.status(500).json({
          status: false,
          message: "Failed to send email",
        });
      }
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      let { token } = req.query;
      let user_id = req.params.id;
      let { password, confirmPassword } = req.body;

      if (!password || !confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Password and Password confirmation must be required",
          data: null,
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: false,
          message:
            "Please ensure that the password and password confirmation match!",
          data: null,
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);

      jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(400).json({
            status: false,
            message: "Bad request",
            err: err.message,
            data: null,
          });
        }
        const updateUser = await prisma.user.update({
          where: { email: decoded.email },
          data: { password: encryptedPassword },
          select: { id: true, first_name: true, last_name: true, email: true },
        });

        const newNotification = await prisma.notification.create({
          data: {
            title: "Notification",
            message: "Password successfully reset",
            createdAt: formattedDate(new Date()),
            user_id: updateUser.id,
          },
        });

        io.emit(`user-${updateUser.id}`, newNotification);

        res.status(200).json({
          status: true,
          message: "Reset user password successfully!",
          data: updateUser,
        });
      });
    } catch (err) {
      next(err);
    }
  },
  pageLogin: async (req, res, next) => {
    try {
      res.render("login.ejs");
    } catch (error) {
      next(error);
    }
  },
  pageForgetPass: async (req, res, next) => {
    try {
      res.render("forgot-password.ejs");
    } catch (error) {
      next(error);
    }
  },
  pageResetPass: async (req, res, next) => {
    try {
      let { token } = req.query;
      res.render("reset-password.ejs", { token });
    } catch (error) {
      next(error);
    }
  },
  pageNotification: async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const notifications = await prisma.notification.findMany({
        where: { user_id: id }
      });

      res.render("notification.ejs", {
        user_id: id,
        notifications: notifications,
      });
    } catch (error) {
      next(error);
    }
  },
};
