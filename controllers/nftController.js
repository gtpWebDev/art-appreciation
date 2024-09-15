//prisma client, managing the postgres connection
const prisma = require("../config/prismaClient");

const { query, body, param, validationResult } = require("express-validator");

// const passwordUtils = require("../utils/passwordUtils");

// short form, applying try {} catch(err)
const asyncHandler = require("express-async-handler");

// get the number of nfts
exports.nft_count_get = [
  // no authentication
  // No authorisation middleware

  asyncHandler(async (req, res, next) => {
    prisma.nft
      .count()
      .then((nftCount) => {
        console.log(nftCount);
        if (!nftCount) {
          return res
            .status(401)
            .json({ success: false, msg: "could not access nft information" });
        }
        res.status(200).json({ success: true, data: nftCount });
      })
      .catch((err) => {
        next(err);
      });
  }),
];

// get the details of a single nft
exports.nft_detail = [
  // no authentication
  // No authorisation middleware

  // Validate and sanitise the nft id
  param("nftId", "Invalid nft id format").trim().isString().escape(),

  asyncHandler(async (req, res, next) => {
    const validationObject = validationResult(req);

    if (!validationObject.isEmpty()) {
      // Errors exist.
      res.status(400).json({ success: false, msg: "Invalid nft id format" });
    } else {
      prisma.nft
        .findUnique({
          where: {
            id: req.params.nftId,
          },
        })
        .then((nftDetails) => {
          console.log(nftDetails);
          if (!nftDetails) {
            return res
              .status(401)
              .json({ success: false, msg: "could not access nft detail" });
          }
          res.status(200).json({ success: true, data: nftDetails });
        })
        .catch((err) => {
          next(err);
        });
    }
  }),
];
