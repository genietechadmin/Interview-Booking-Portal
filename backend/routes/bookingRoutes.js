const express = require("express");

const {
  getAvailableSlots,
  createBooking,
  bookingHistory,
  confirmLinkController,
  rescheduleBooking,
  cancelBookingController,
} = require("../controllers/bookingController");

const router = express.Router();

router.get("/slots", getAvailableSlots);

router.post("/create", createBooking);

router.get("/history/:candidateId", bookingHistory);

router.put("/confirm-link", confirmLinkController);

router.post("/reschedule", rescheduleBooking);

router.post("/cancel", cancelBookingController);

module.exports = router;