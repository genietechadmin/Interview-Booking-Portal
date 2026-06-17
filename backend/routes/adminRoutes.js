const express = require("express");

const {
  adminLogin,
  getAdminBookings,
  getTrainersController,
  assignTrainerController,
  completeBookingController,
} = require("../controllers/adminController");

const router = express.Router();

router.post("/login", adminLogin);

router.get("/bookings", getAdminBookings);

router.get("/trainers", getTrainersController);

router.put("/assign-trainer", assignTrainerController);

router.put("/complete-booking", completeBookingController);

module.exports = router;