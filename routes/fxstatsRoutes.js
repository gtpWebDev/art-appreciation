var express = require("express");
var router = express.Router();

const fxstats_controller = require("../controllers/fxstatsController");

// creates a modular, mountable route handler

/* Not using the root as no use for a list of nfts. */
router.get("/", fxstats_controller.summary_stats);

module.exports = router;
