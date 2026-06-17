import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    try {
      const response = await API.post("/admin/login", {
        username,
        password,
      });

      localStorage.setItem(
        "adminToken",
        response.data.token
      );

      navigate("/admin/dashboard");
    } catch (error) {
  Swal.fire({
    icon: "error",
    title: "Login Failed",
    text:
      error.response?.data?.message ||
      "Admin login failed",
    confirmButtonColor: "#ED8936",
    width: window.innerWidth < 640 ? "90%" : "380px",
  });
}
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
  <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-5">
      <div className="bg-[#1A1A1A] rounded-lg p-2">
        <img
          src="/logo.png"
          alt="GENIE"
          className="h-10 object-contain"
        />
      </div>
    </div>
  </div>
</header>

      {/* Login Form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1A1A1A]">
              Admin Login
            </h2>

            <p className="text-[#F2994A] font-medium mt-2">
              Login to manage interview bookings
            </p>
          </div>

          <input
            type="text"
            placeholder="Username"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 mb-4 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 mb-5 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full rounded-xl bg-[#ED8936] py-3 font-semibold text-white shadow-md hover:bg-[#DD6B20] hover:shadow-lg transition duration-200"
          >
            Login
          </button>

          <div className="mt-8 pt-5 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Interview Booking Administration
            </p>

            <p className="text-center text-xs text-gray-400 mt-2">
              © {new Date().getFullYear()} Genie Tech Consultants
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;