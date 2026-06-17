import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import OtpVerification from "./pages/OtpVerification";
import Dashboard from "./pages/Dashboard";
import Booking from "./pages/Booking";
import Reschedule from "./pages/Reschedule";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-otp" element={<OtpVerification />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/reschedule" element={<Reschedule />} />

        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;