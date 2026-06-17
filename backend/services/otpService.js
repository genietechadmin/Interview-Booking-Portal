const otpStore = {};

function generateOtp(candidateId) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[candidateId] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  return otp;
}

function verifyOtp(candidateId, enteredOtp) {
  const record = otpStore[candidateId];

  if (!record) return false;
  if (Date.now() > record.expiresAt) return false;
  if (record.otp !== enteredOtp) return false;

  delete otpStore[candidateId];
  return true;
}

module.exports = { generateOtp, verifyOtp };