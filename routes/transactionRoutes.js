var express = require("express");
var router = express.Router();

// Trying this out - an endpoint for transactions which cover
// both the purchases and listings table contents

const transaction_controller = require("../controllers/transactionController");

// creates a modular, mountable route handler

/* GET count of all transactions */
// router.get("/count", nft_controller.nft_count_get);

/* GET transactions for a single Nft */
router.get("/nfts/:nftId", transaction_controller.single_nft);

module.exports = router;
