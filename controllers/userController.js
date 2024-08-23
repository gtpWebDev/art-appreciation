//prisma client, managing the postgres connection
const prisma = require("../config/prismaClient");

const { body, validationResult } = require("express-validator");

const passwordUtils = require("../utils/passwordUtils");

// short form, applying try {} catch(err)
const asyncHandler = require("express-async-handler");

// Display home page
exports.index = asyncHandler(async (req, res, next) => {
  res.status(200).json({ msg: "this is the /user endpoint" });
});

// display register page
exports.register_get = asyncHandler(async (req, res, next) => {
  const form =
    '<h1>Register Page</h1><form method="post" action="/user/register">\
                  Enter Username:<br><input type="text" name="username">\
                  <br>Enter Password:<br><input type="password" name="password">\
                  <br><br><input type="submit" value="Submit"></form>';

  res.send(form);
});

// user attempts to register
exports.register_post = [
  // Validate and sanitize received inputs (username and password).
  body("username", "First name must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("password", "Password must be a minimum of 3 characters.")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    console.log("errors array", errors.array());

    if (!errors.isEmpty()) {
      // There are errors. Send a message that registration has failed.

      // construct helpful error message - optional
      let errorMsg = "";
      errors.array().forEach((element) => {
        errorMsg += element.msg + " ";
      });
      errorMsg = errorMsg.slice(0, -1);

      res.status(400).json({ success: false, msg: errorMsg });
    } else {
      // Data from form is valid.

      // apply the local strategy to generate a salt and password hash from the password
      const saltAndHash = passwordUtils.generatePassword(req.body.password);
      const salt = saltAndHash.salt;
      const passwordHash = saltAndHash.passwordHash;

      const newUser = {
        username: req.body.username,
        hash: passwordHash,
        salt: salt,
      };

      // add the new user to the database

      prisma.user.create({ data: newUser }).then((user) => {
        console.log("adding new user", user);

        // issue a JWT and return it
        const jwt = passwordUtils.issueJWT(user);

        // console.log("token", jwt.token);

        res.status(200).json({
          success: true,
          user: user,
          token: jwt.token,
          expiresIn: jwt.expires,
        });
      });
    }
  }),
];

// user requests login page
exports.login_get = asyncHandler(async (req, res, next) => {
  const form =
    '<h1>Login Page</h1><form method="POST" action="/user/login">\
  Enter Username:<br><input type="text" name="username">\
  <br>Enter Password:<br><input type="password" name="password">\
  <br><br><input type="submit" value="Submit"></form>';
  res.send(form);
});

// // user attempts to login
exports.login_post = asyncHandler(
  // if failureRedirect and successRedirect are used above, this next middleware function would not be called
  async (req, res, next) => {
    prisma.user
      .findUnique({
        where: {
          username: req.body.username,
        },
      })
      .then((user) => {
        if (!user) {
          return res
            .status(401)
            .json({ success: false, msg: "Unauthorised: could not find user" });
        }

        // Function defined at bottom of app.js
        const isValid = passwordUtils.validatePassword(
          req.body.password,
          user.hash,
          user.salt
        );

        if (isValid) {
          const jwt = passwordUtils.issueJWT(user);
          res.status(200).json({
            success: true,
            user: user,
            token: jwt.token,
            expiresIn: jwt.expires,
          });
        } else {
          res
            .status(401)
            .json({ success: false, msg: "Unauthorised: incorrect password" });
        }
      })
      .catch((err) => {
        next(err);
      });
  }
);
