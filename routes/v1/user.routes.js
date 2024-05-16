const router = require("express").Router();
const {
  register,
  index,
  show,
  forgotPassword,
  resetPassword,
  pageLogin,
  pageForgetPass,
  pageResetPass
} = require("../../controllers/user.controller");
const { restrict } = require("../../middlewares/auth.middleware");

router.post("/users", register);
router.get("/users", index);
router.get("/users/:id", restrict, show);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Render
router.get("/login", pageLogin);
router.get("/forgot-password", pageForgetPass);
router.get("/reset-password", pageResetPass);

module.exports = router;