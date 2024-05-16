const router = require("express").Router();
const {
  login,
  verified,
  googleOauth2,
} = require("../../controllers/auth.controller");
const { restrict } = require("../../middlewares/auth.middleware");
const passport = require("../../libs/passport");

router.post("/auth/login", login);
router.get("/auth/authenticate", restrict, verified);

// Google OAuth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google",
    session: false,
  }),

  googleOauth2
);

module.exports = router;
