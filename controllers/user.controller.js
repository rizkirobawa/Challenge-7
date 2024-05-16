const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;
const path = require("path");
const nodemailer = require("../libs/nodemailer");
const { getHTML, sendMail } = require("../libs/nodemailer");

module.exports = {
  register: async (req, res, next) => {
    try {
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
      const findUser = await prisma.user.findUnique({ where: { email} });
  
      if (!findUser) {
        return res.status(404).json({
          status: false,
          message: "Email not found",
        });
      }
  
      const token = jwt.sign({ email: findUser.email }, JWT_SECRET_KEY);

      const html = await nodemailer.getHTML("email-reset-password.ejs", {
        name: findUser.first_name, 
        url: `${req.protocol}://${req.get('host')}/api/v1/reset-password?token=${token}`,
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
      const { token } = req.query;
      const { id } = req.params;

      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        return res
          .status(404)
          .json({ status: false, message: "User not exists" });
      }

      try {
        const verify = jwt.verify(token, JWT_SECRET_KEY);
        res.render("reset-password", { verify });
      } catch (error) {
        res.send("Not verified");
      }
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
};