var createError = require("http-errors");
var express = require("express");
var path = require("path");
var logger = require("morgan");
const cors = require("cors");
var passport = require("passport");

var indexRouter = require("./routes/indexRoutes");

// manage use of environment variables in the .env file
require("dotenv").config();

const app = express();

// Configures the database and opens a global connection that can be used in any module with mongoose.collection
// require("./config/database");

/**
 * Note, sessions not required because the JWTs themselves provide the continuity
 * that sessions otherwise provide for the local strategy.
 */

/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 */

// Need to require the entire Passport config module so app.js knows about it
// The JWT implementation requires the global passport object to be passed through as a parameter
require("./config/passport")(passport);

// enable receiving json in the body of push and put requests
app.use(express.json());
// enable receiving strings or arrays in the body of push and put requests
app.use(express.urlencoded({ extended: false }));

// view engine setup - will be removed when react front-end incorporated
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "ejs");

// app.use binds the middleware to an instance of the application object
// this middleware is what generates the "GET /login 200 2.513ms - 286" type outputs
app.use(logger("dev"));

// This will allow requests form another domain (such as a separate react front-end)
app.use(cors());

// enables static files to be served (__dirname is the folder path of this file)
app.use(express.static(path.join(__dirname, "public")));

// mount the routers as middleware (different routes handles in indexRouter)
app.use("/", indexRouter);

/**
 * -------------- ERROR HANDLING ----------------
 */

// 404 handler for undefined routes
app.use(function (req, res, next) {
  next(createError(404));
});

// Final global error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // status set as the specific error status, or 500 if not available, for "Internal server error"
  // Worth thinking about exact output here, but basic success true/false and msg
  res.status(err.status || 500).json({ success: false, msg: err.message });
});

module.exports = app;
