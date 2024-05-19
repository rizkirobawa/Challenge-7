const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  createNotification: async (req, res, next) => {
    try {
      let { user_id } = req.params;
      let { title, message, createdAt } = req.body;

      const user = await prisma.user.findMany();

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "User not found",
          data: null,
        });
      }

      if (!title || !message) {
        return res.status(400).json({
          status: false,
          message: "Title and message are required",
        });
      }

      const newNotification = await prisma.notification.create({
        data: {
          title,
          message,
          createdAt: formattedDate(new Date()),
          user: { connect: { id: parseInt(user_id) } },
        },
      });

      return res.status(201).json({
        status: true,
        message: "Notification created successfully",
        data: newNotification,
      });
    } catch (err) {
      next(err);
    }
  },
  getAllNotification: async (req, res, next) => {
    try {
      const notification = await prisma.notification.findMany();

      res.status(200).json({
        status: true,
        message: "OK",
        data: notification,
      });
    } catch (err) {
      next(err);
    }
  }
};
