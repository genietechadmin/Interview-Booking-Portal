import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function Login() {
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!candidateId.trim()) {
      Swal.fire({
  icon: "error",
  title: "Login Failed",
  text: "Candidate ID not found.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
      return;
    }

    try {
      setLoading(true);

      await API.post("/auth/request-otp", {
        candidateId,
      });

      navigate("/verify-otp", {
        state: { candidateId },
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Candidate ID not found.",
        confirmButtonColor: "#ED8936",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="bg-[#1A1A1A] rounded-lg p-2">
            <img
              src="/logo.png"
              alt="Genie Tech Consultants"
              className="h-10 sm:h-12 object-contain"
            />
          </div>

          <button
            onClick={() => navigate("/admin")}
            className="rounded-lg border border-[#F2994A] px-5 py-2 text-sm font-semibold text-[#F2994A] hover:bg-orange-50 transition"
          >
            Admin Login
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              Candidate Login
            </h2>

            <p className="text-[#F2994A] font-medium mt-2">
              Login using your Candidate ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Candidate ID
            </label>

            <input
              type="text"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              placeholder="Eg: GTC-007710042026"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder:text-sm placeholder:text-gray-400 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
            />

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full mt-5 rounded-xl bg-[#ED8936] py-3 font-semibold text-white shadow-md hover:bg-[#DD6B20] hover:shadow-lg transition duration-200 disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Secure Interview Scheduling System
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

export default Login;