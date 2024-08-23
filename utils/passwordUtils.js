const crypto = require("crypto");
const jsonwebtoken = require("jsonwebtoken");

require("dotenv").config();

var PRIVATE_KEY = process.env.RSA_PRIVATE_KEY;

/*
  Registration / generating password:
  1. User provides "username" and "password" when they register
  2. Algorithm generates "salt" - a big pseudorandom number
  3. Another algorithm generates a "passwordHash" from the password and salt.
  4. Both salt and passwordHash stored in the database
*/

function generatePassword(password) {
  // adds an additional big pseudo-random number to password - effectively creates a massive amount of randomness to the generation of the hash
  // avoids million people using "password" generating the same passwordHash as would be "password3847384734834873"
  var salt = crypto.randomBytes(32).toString("hex");

  // pass in the password, the generated salt, the number of iterations, the length of string, and the hashing function
  // easy to look up pbkdf2 to understand details
  var passwordHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return {
    salt: salt,
    passwordHash: passwordHash,
  };
}

/*
  Logging in / validating password:
  1. Use provides "username" and "password" when attempting login.
  2. Collect "salt" and "passwordHash" from database using username.
  3. Use same algorithm on password and salt to generate passwordHash.
  4. Check if the database passwordHash and newly generated passwordHash match.
  5. Hash functions with same inputs produce same outputs, so if they match, all good, otherwise reject.
*/

function validatePassword(password, passwordHash, salt) {
  var hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return passwordHash === hashVerify;
}

/**
 * MAY NEED MONGO TO POSTGRES UPDATE?
 * Generates a JWT containing a payload with the user id from the database
 * @param {*} user - The user object from the database.  We need this to set the JWT `sub` payload property to the database user ID
 */
function issueJWT(user) {
  const _id = user._id;

  const expiresIn = "1d";

  const payload = {
    sub: _id,
    iat: Date.now(),
  };

  const signedToken = jsonwebtoken.sign(payload, PRIVATE_KEY, {
    expiresIn: expiresIn,
    algorithm: "RS256",
  });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn,
  };
}

module.exports = {
  validatePassword: validatePassword,
  generatePassword: generatePassword,
  issueJWT: issueJWT,
};
