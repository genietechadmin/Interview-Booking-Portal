const jwt = require("jsonwebtoken");
const { findRegisteredCandidate } = require("../services/googleSheets");
const { generateOtp, verifyOtp } = require("../services/otpService");
const { sendOtpEmail } = require("../services/emailService");

async function requestOtp(req, res) {
  try {
    const { candidateId } = req.body;

    const candidate = await findRegisteredCandidate(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate ID not found" });
    }

    const otp = generateOtp(candidateId);

    await sendOtpEmail(candidate.email, otp);

    res.json({
      message: "OTP sent successfully",
      email: candidate.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
}

async function verifyCandidateOtp(req, res) {
  try {
    const { candidateId, otp } = req.body;

    const isValid = verifyOtp(candidateId, otp);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const token = jwt.sign(
      { candidateId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      candidateId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OTP verification failed" });
  }
}

module.exports = {
  requestOtp,
  verifyCandidateOtp,
};