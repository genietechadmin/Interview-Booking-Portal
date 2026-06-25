const jwt = require("jsonwebtoken");
const { findRegisteredCandidate } = require("../services/googleSheets");
const { generateOtp, verifyOtp } = require("../services/otpService");
const { sendOtpEmail } = require("../services/emailService");

async function requestOtp(req, res) {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        message: "Candidate ID is required",
      });
    }

    const candidate = await findRegisteredCandidate(candidateId);

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate ID not found",
        errorCode: "CANDIDATE_NOT_FOUND",
      });
    }

    const otp = generateOtp(candidateId);

    try {
      await sendOtpEmail(candidate.email, otp);
    } catch (emailError) {
      console.error("OTP email sending failed:", emailError.message);

      return res.status(500).json({
        message:
          "Candidate found, but OTP email could not be sent. Please contact admin.",
        errorCode: "OTP_EMAIL_FAILED",
      });
    }

    res.json({
      message: "OTP sent successfully",
      email: candidate.email,
    });
  } catch (error) {
    console.error("Request OTP failed:", error.message);

    res.status(500).json({
      message: "Failed to process OTP request",
      errorCode: "OTP_REQUEST_FAILED",
    });
  }
}

async function verifyCandidateOtp(req, res) {
  try {
    const { candidateId, otp } = req.body;

    if (!candidateId || !otp) {
      return res.status(400).json({
        message: "Candidate ID and OTP are required",
      });
    }

    const isValid = verifyOtp(candidateId, otp);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        errorCode: "INVALID_OTP",
      });
    }

    const token = jwt.sign({ candidateId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token,
      candidateId,
    });
  } catch (error) {
    console.error("OTP verification failed:", error.message);

    res.status(500).json({
      message: "OTP verification failed",
      errorCode: "OTP_VERIFY_FAILED",
    });
  }
}

module.exports = {
  requestOtp,
  verifyCandidateOtp,
};