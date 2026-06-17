const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Interview Booking Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});