import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

function Dashboard() {
  const [candidate, setCandidate] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const candidateId = localStorage.getItem("candidateId");

      if (!candidateId) {
        setError("Candidate ID not found. Please login again.");
        return;
      }

      const [candidateResponse, bookingResponse] = await Promise.all([
  API.get(`/candidate/details/${candidateId}`),
  API.get(`/booking/history/${candidateId}`),
]);

setCandidate(candidateResponse.data);
setBookings(bookingResponse.data.bookings || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load dashboard data.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("candidateId");
    navigate("/");
  };

const cancelBooking = async (booking) => {
  const result = await Swal.fire({
    icon: "warning",
    title: "Cancel Booking?",
    text: "Are you sure you want to cancel this booking?",
    showCancelButton: true,
    confirmButtonText: "Yes, Cancel",
    cancelButtonText: "No",
    confirmButtonColor: "#ED8936",
    width: "380px",
  });

  if (!result.isConfirmed) return;

  try {
    await API.post("/booking/cancel", {
      candidateId: booking.candidateId,
      date: booking.date,
      startTime: booking.startTime,
    });

    Swal.fire({
      icon: "success",
      title: "Cancelled",
      text: "Booking cancelled successfully",
      confirmButtonColor: "#ED8936",
      width: "380px",
    });

    fetchDashboardData();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Cancel Failed",
      text:
        error.response?.data?.message ||
        "Failed to cancel booking",
      confirmButtonColor: "#ED8936",
      width: "380px",
    });
  }
};

const confirmLinkReceived = async (booking) => {
  const result = await Swal.fire({
    icon: "question",
    title: "Interview Link",
    text: "Have you received the interview link?",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
    confirmButtonColor: "#ED8936",
    width: "380px",
  });

  if (!result.isConfirmed) return;

  try {
    await API.put("/booking/confirm-link", {
      candidateId: booking.candidateId,
      date: booking.date,
      startTime: booking.startTime,
    });

    Swal.fire({
      icon: "success",
      title: "Confirmed",
      text: "Booking confirmed successfully",
      confirmButtonColor: "#ED8936",
      width: "380px",
    });

    fetchDashboardData();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Confirmation Failed",
      text:
        error.response?.data?.message ||
        "Failed to confirm booking",
      confirmButtonColor: "#ED8936",
      width: "380px",
    });
  }
};

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">{error}</h2>
          <button
            onClick={() => navigate("/")}
            className="mt-5 rounded-lg bg-[#F2994A] px-5 py-2 text-white font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <h2 className="text-xl font-semibold text-gray-700">
          Loading dashboard...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <img
                src="/logo.png"
                alt="Genie Tech Consultants"
                className="h-10 object-contain"
              />
            </div>
          </div>

          <button
  onClick={logout}
  className="rounded-lg border border-[#F2994A] px-5 py-2 text-sm font-semibold text-[#F2994A] hover:bg-orange-50 transition"
>
  Logout
</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-[#F2994A]">
                Candidate Dashboard
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                Welcome, {candidate.candidateName}
              </h2>

              <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500">Candidate ID</p>
                  <p className="font-semibold text-gray-900">
                    {candidate.candidateId}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900">
                    {candidate.phone}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500">Bookings</p>
                  <p className="font-semibold text-gray-900">
                    {bookings.length}
                  </p>
                </div>
              </div>
            </div>

            <button
  onClick={() => navigate("/booking")}
  className="rounded-xl bg-[#ED8936] px-6 py-3 font-semibold text-white shadow-md hover:bg-[#DD6B20] hover:shadow-lg transition duration-200"
>
  Book New Slot
</button>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Booking History
              </h2>
              <p className="text-sm text-gray-500">
                View your scheduled, waiting list and cancelled interviews.
              </p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <p className="text-gray-500">No bookings found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {booking.companyName}
                        </h3>

                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">HR Name</p>
                          <p className="font-semibold text-gray-900">
                            {booking.hrName}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500">HR Number</p>
                          <p className="font-semibold text-gray-900">
                            {booking.hrNumber}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500">Round</p>
                          <p className="font-semibold text-gray-900">
                            {booking.round}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500">Link Received</p>
                          <p className="font-semibold text-gray-900">
                            {booking.linkReceived}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-semibold text-gray-900">
                            {booking.date}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500">Start Time</p>
                          <p className="font-semibold text-gray-900">
                            {booking.startTime}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500">End Time</p>
                          <p className="font-semibold text-gray-900">
                            {booking.endTime}
                          </p>
                        </div>
                        <div>
  <p className="text-gray-500">Trainer Assigned</p>
  <p className="font-semibold text-[#ED8936]">
    {booking.trainerName || "Not Assigned"}
  </p>
</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {booking.status === "Waiting List" && (
                        <button
                          onClick={() => confirmLinkReceived(booking)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          Confirm Link Received
                        </button>
                      )}

                      {booking.status !== "Cancelled" && (
                        <>
                          <button
                            onClick={() =>
                              navigate("/reschedule", {
                                state: { booking },
                              })
                            }
                            className="rounded-lg border border-[#F2994A] px-4 py-2 text-sm font-semibold text-[#F2994A] hover:bg-orange-50"
                          >
                            Reschedule
                          </button>

                          <button
                            onClick={() => cancelBooking(booking)}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;