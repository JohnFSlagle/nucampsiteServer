const express = require("express");
const User = require("../models/user");
const passport = require("passport");
const authenticate = require("../authenticate");
const cors = require("./cors");

const router = express.Router();

/* GET users listing. */
router.get(
  "/",
  cors.corsWithOptions,
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  (req, res, next) => {
    User.find()
      .then((users) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(users);
      })
      .catch((err) => next(err));
  }
);

// Signup Route
router.post("/signup", cors.corsWithOptions, async (req, res, next) => {
  // Validate input
  if (!req.body.username || !req.body.password) {
    res.status(400); // Bad Request
    res.setHeader("Content-Type", "application/json");
    return res.json({ error: "Username and password are required." });
  }

  try {
    // Create a new user
    const newUser = new User({ username: req.body.username });
    const user = await User.register(newUser, req.body.password); // register returns a promise

    if (req.body.firstname) {
      user.firstname = req.body.firstname;
    }
    if (req.body.lastname) {
      user.lastname = req.body.lastname;
    }

    await user.save(); // Save returns a promise

    // Authenticate user after registration
    passport.authenticate("local")(req, res, () => {
      res.status(200); // OK
      res.setHeader("Content-Type", "application/json");
      return res.json({ success: true, status: "Registration Successful!" });
    });
  } catch (err) {
    res.status(500); // Internal Server Error
    res.setHeader("Content-Type", "application/json");
    return res.json({ error: err.message }); // Return error message
  }
});

// Login Route
router.post(
  "/login",
  cors.corsWithOptions,
  passport.authenticate("local"),
  (req, res) => {
    // Generate token for authenticated user
    const token = authenticate.getToken({ _id: req.user._id });
    res.status(200); // OK
    res.setHeader("Content-Type", "application/json");
    return res.json({
      success: true,
      token: token,
      status: "You are successfully logged in!",
    });
  }
);

// Logout Route
router.get("/logout", cors.corsWithOptions, (req, res, next) => {
  if (req.session) {
    req.session.destroy((err) => {
      // Handle errors in session destruction
      if (err) {
        return next(err); // Pass error to Express error handler
      }
      res.clearCookie("session-id"); // Ensure this matches your session cookie name
      res.redirect("/");
    });
  } else {
    const err = new Error("You are not logged in!");
    err.status = 401; // Unauthorized
    return next(err); // Pass error to Express error handler
  }
});

router.get(
  "/facebook/token",
  passport.authenticate("facebook-token"),
  (req, res) => {
    if (req.user) {
      const token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: true,
        token: token,
        status: "You are successfully logged in!",
      });
    }
  }
);

module.exports = router;
