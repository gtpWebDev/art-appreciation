var express = require("express");
var router = express.Router();

const nft_controller = require("../controllers/nftController");

// creates a modular, mountable route handler

/* Not using the root as no use for a list of nfts. */
// router.get("/", nft_controller.index);

/* GET register page - get the template for registering. */
// useful to keep this for a quick dev test that the server's working
router.get("/count", nft_controller.nft_count_get);

/* GET details for a single Nft */
router.get("/:nftId", nft_controller.nft_detail);

/* POST register page - user attempts to register. */
// router.post("/register", nft_controller.register_post);

/* GET login page - get the template for logging in. */
// router.get("/login", nft_controller.login_get);

/* POST login page - user attempts to login. */
// router.post("/login", nft_controller.login_post);

/* GET protected page to test authorization works */
// no longer relevant
// router.get("/protected", user_controller.protected_get);

/* GET protected page to test authorization works */
// disabled but works
// router.get("/admin", user_controller.admin_get);

// GET user dashboard
// router.get("/dashboard", user_controller.dashboard_get);

// POST logout page - user attempts to logout
// router.get("/logout", user_controller.logout_get);

module.exports = router;
