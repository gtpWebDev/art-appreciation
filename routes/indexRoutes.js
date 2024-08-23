var express = require("express");
const router = express.Router();

// this acts as a conduit for all the routes to reduce routes in app.js to one line

const userRouter = require("./userRoutes");

router.use("/user", userRouter);

// Test backend up and running
router.get("/", (req, res, next) => {
  res.status(200).json({ msg: "test - backend service live" });
});

module.exports = router;
