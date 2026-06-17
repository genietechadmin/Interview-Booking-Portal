const express = require("express");
const { getCandidateDetails } = require("../controllers/candidateController");

const router = express.Router();

router.get("/details/:candidateId", getCandidateDetails);

module.exports = router;