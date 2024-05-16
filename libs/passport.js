const passport = require("passport");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL } =
  process.env;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_REDIRECT_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      // Memeriksa apakah emails ada dan memiliki nilai
      if (profile.emails && profile.emails.length > 0) {
        let user = await prisma.user.upsert({
          where: { email: profile.emails[0].value },
          update: { googleid: profile.id },
          create: {
            // Menggunakan properti givenName untuk first_name
            first_name: profile.name.givenName,
            // Menggunakan properti familyName untuk last_name
            last_name: profile.name.familyName,
            email: profile.emails[0].value,
            googleid: profile.id,
          },
        });

        done(null, user);
      } else {
        // Menangani jika tidak ada email yang tersedia di profil
        done(new Error("No email found in profile"), null);
      }
    }
  )
);

module.exports = passport;
