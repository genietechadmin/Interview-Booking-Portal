const express = require("express");
const {
  requestOtp,
  verifyCandidateOtp,
} = require("../controllers/authController");

const router = express.Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyCandidateOtp);

module.exports = router;