const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const config = require("./config.js");

// Local Strategy setup
exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// JWT Token generation
exports.getToken = (user) => {
  return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

// JWT Strategy setup
const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    console.log("JWT payload:", jwt_payload);
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
      if (err) {
        return done(err, false);
      } else if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

// Middleware to verify user
exports.verifyUser = passport.authenticate("jwt", { session: false });

// Middleware to verify if user is an admin
exports.verifyAdmin = (req, res, next) => {
  if (req.user && req.user.admin) {
    next(); // User is an admin, proceed to the next middleware
  } else {
    // User is not an admin, return an error with status 403
    const err = new Error("You are not authorized to perform this operation!");
    err.status = 403;
    next(err);
  }
};
