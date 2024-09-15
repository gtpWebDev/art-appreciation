//prisma client, managing the postgres connection
const prisma = require("../config/prismaClient");

// short form, applying try {} catch(err)
const asyncHandler = require("express-async-handler");

const { query, body, param, validationResult } = require("express-validator");

// get the transactions for a single nft
// "kHaCE_141851" useful test case
exports.single_nft = [
  // no authentication
  // No authorisation middleware

  // Validate and sanitise the nft id
  param("nftId", "Invalid nft id format").trim().isString().escape(),

  asyncHandler(async (req, res, next) => {
    const validationObject = validationResult(req);

    if (!validationObject.isEmpty()) {
      // Errors exist.
      res.status(400).json({ success: false, msg: "Invalid nft id" });
    } else {
      const transactions = await prisma.$queryRaw`
        SELECT transaction_type, nft_id, account_id, id AS purchase_id, timestamp, price_tz, price_usd, score, normalised_score
        FROM "Transaction"
        WHERE "nft_id" = ${req.params.nftId}
        ORDER BY timestamp ASC;
      `;

      res.status(200).json(transactions);
    }
  }),
];
