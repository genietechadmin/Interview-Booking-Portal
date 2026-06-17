const {
  getAllBookings,
  assignTrainer,
  getAllTrainers,
  getTrainerByName,
  completeBooking,
} = require("../services/bookingSheetService");

const { findRegisteredCandidate } = require("../services/googleSheets");

const {
  sendTrainerAssignedEmail,
} = require("../services/emailService");

async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return res.json({
        message: "Admin login successful",
        token: "admin-token",
      });
    }

    return res.status(401).json({
      message: "Invalid admin username or password",
    });
  } catch (error) {
    res.status(500).json({
      message: "Admin login failed",
      error: error.message,
    });
  }
}

async function getAdminBookings(req, res) {
  try {
    const { status } = req.query;

    const bookings = await getAllBookings(status);

    res.json({
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin bookings",
      error: error.message,
    });
  }
}

async function getTrainersController(req, res) {
  try {
    const trainers = await getAllTrainers();

    res.json({
      trainers,
    });
  } catch (error) {
  console.error("Trainer fetch error:", error);

  res.status(500).json({
    message: "Failed to fetch trainers",
    error: error.message,
  });
}
}

async function assignTrainerController(req, res) {
  try {
    const { candidateId, date, startTime, trainerName } = req.body;

    if (!candidateId || !date || !startTime || !trainerName) {
      return res.status(400).json({
        message:
          "Candidate ID, date, start time and trainer name are required",
      });
    }

    const trainer = await getTrainerByName(trainerName);

    if (!trainer) {
      return res.status(404).json({
        message: "Trainer not found",
      });
    }

    const updatedBooking = await assignTrainer(
      candidateId,
      date,
      startTime,
      trainerName
    );

    const registeredCandidate = await findRegisteredCandidate(candidateId);

    if (registeredCandidate?.email) {
      await sendTrainerAssignedEmail(registeredCandidate.email, {
        candidateId,
        candidateName: updatedBooking.candidateName,
        companyName: updatedBooking.companyName,
        round: updatedBooking.round,
        date: updatedBooking.date,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        trainerName: trainer.trainerName,
        trainerNumber: trainer.trainerNumber,
        isTrainerChanged: updatedBooking.isTrainerChanged,
      });
    }

    res.json({
      message: updatedBooking.isTrainerChanged
        ? "Trainer updated successfully"
        : "Trainer assigned successfully",
      booking: {
        ...updatedBooking,
        trainerNumber: trainer.trainerNumber,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Trainer assignment failed",
      error: error.message,
    });
  }
}
async function completeBookingController(req, res) {
  try {
    const { candidateId, date, startTime } = req.body;

    if (!candidateId || !date || !startTime) {
      return res.status(400).json({
        message: "Candidate ID, date and start time are required",
      });
    }

    await completeBooking(candidateId, date, startTime);

    res.json({
      message: "Booking marked as completed",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete booking",
      error: error.message,
    });
  }
}
module.exports = {
  adminLogin,
  getAdminBookings,
  getTrainersController,
  assignTrainerController,
  completeBookingController,
};