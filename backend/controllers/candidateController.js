const { findCandidateDetails } = require("../services/googleSheets");

async function getCandidateDetails(req, res) {
  try {
    const { candidateId } = req.params;

    const candidate = await findCandidateDetails(candidateId);

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate details not found",
      });
    }

    res.json(candidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch candidate details",
    });
  }
}

module.exports = { getCandidateDetails };