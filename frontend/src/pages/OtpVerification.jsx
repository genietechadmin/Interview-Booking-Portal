import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import Swal from "sweetalert2";

function OtpVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const candidateId = location.state?.candidateId;

  const verifyOtp = async () => {
    if (!otp.trim()) {
  Swal.fire({
    icon: "warning",
    title: "OTP Required",
    text: "Please enter OTP.",
    confirmButtonColor: "#ED8936",
    width: window.innerWidth < 640 ? "90%" : "380px",
  });
  return;
}

    try {
      setLoading(true);

      const response = await API.post("/auth/verify-otp", {
        candidateId,
        otp,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("candidateId", response.data.candidateId);

      navigate("/dashboard");
    } catch {
  Swal.fire({
    icon: "error",
    title: "Verification Failed",
    text: "Invalid OTP.",
    confirmButtonColor: "#ED8936",
    width: window.innerWidth < 640 ? "90%" : "380px",
  });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await API.post("/auth/request-otp", {
        candidateId,
      });

      Swal.fire({
  icon: "success",
  title: "OTP Sent",
  text: "OTP has been sent again successfully.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
    } catch {
      Swal.fire({
  icon: "error",
  title: "Failed",
  text: "Unable to resend OTP.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="bg-[#1A1A1A] rounded-lg p-2 inline-block">
            <img
              src="/logo.png"
              alt="Genie Tech Consultants"
              className="h-10 sm:h-12 object-contain"
            />
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              OTP Verification
            </h1>

            <p className="text-gray-500 text-sm mt-2">
              Enter the OTP sent to your registered email
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Candidate ID
              </label>

              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600">
                {candidateId}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
  Enter 6-digit OTP
</label>

              <input
  type="text"
  maxLength="6"
  value={otp}
  onChange={(e) => setOtp(e.target.value)}
  placeholder="Enter OTP"
  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg font-medium text-gray-800 placeholder:text-sm placeholder:text-gray-400 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
/>
            </div>

            <button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full mt-5 rounded-xl bg-[#ED8936] py-3 font-semibold text-white shadow-md hover:bg-[#DD6B20] hover:shadow-lg transition duration-200 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              onClick={resendOtp}
              className="w-full text-sm font-semibold text-[#F2994A] hover:underline"
            >
              Resend OTP
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
            © Genie Tech Consultants
          </p>
        </div>
      </div>
    </div>
  );
}

export default OtpVerification;