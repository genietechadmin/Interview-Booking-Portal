import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState({});
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState([]);

  const navigate = useNavigate();

  const popupWidth = window.innerWidth < 640 ? "90%" : "380px";

  const fetchBookings = async (selectedStatus = "All") => {
    try {
      setLoading(true);

      let url = "/admin/bookings";

      if (selectedStatus !== "All") {
        url += `?status=${selectedStatus}`;
      }

      const response = await API.get(url);
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Loading Failed",
        text: "Failed to load admin bookings.",
        confirmButtonColor: "#ED8936",
        width: popupWidth,
      });
    } finally {
      setLoading(false);
    }
  };
const fetchTrainers = async () => {
  try {
    const response = await API.get("/admin/trainers");
    setTrainers(response.data.trainers || []);
  } catch {
    Swal.fire({
      icon: "error",
      title: "Trainer Load Failed",
      text: "Failed to load trainers.",
      confirmButtonColor: "#ED8936",
      width: popupWidth,
    });
  }
};
  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin");
      return;
    }

    fetchBookings();
    fetchTrainers();
  }, []);

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const assignTrainer = async (booking) => {
  if (trainers.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "No Trainers Found",
      text: "Please add trainers in the Trainers sheet.",
      confirmButtonColor: "#ED8936",
      width: popupWidth,
    });
    return;
  }

  const inputOptions = {};

  trainers.forEach((trainer) => {
    inputOptions[trainer.trainerName] = trainer.trainerName;
  });

  const result = await Swal.fire({
    title: booking.trainerName ? "Edit Trainer" : "Assign Trainer",
    input: "select",
    inputOptions,
    inputValue: booking.trainerName || "",
    inputPlaceholder: "Select trainer",
    showCancelButton: true,
    confirmButtonText: booking.trainerName ? "Update" : "Assign",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#ED8936",
    cancelButtonColor: "#6B7280",
    width: window.innerWidth < 640 ? "90%" : "400px",
    inputValidator: (value) => {
      if (!value) {
        return "Please select trainer";
      }
    },
  });

  if (!result.isConfirmed) return;

  try {
    await API.put("/admin/assign-trainer", {
      candidateId: booking.candidateId,
      date: booking.date,
      startTime: booking.startTime,
      trainerName: result.value,
    });

    await Swal.fire({
      icon: "success",
      title: booking.trainerName ? "Trainer Updated" : "Trainer Assigned",
      text: booking.trainerName
        ? "Trainer changed successfully."
        : "Trainer assigned successfully.",
      confirmButtonColor: "#ED8936",
      width: popupWidth,
    });

    fetchBookings(status);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Assignment Failed",
      text:
        error.response?.data?.message ||
        "Failed to assign trainer.",
      confirmButtonColor: "#ED8936",
      width: popupWidth,
    });
  }
};

const showBookingText = async (booking) => {
  const result = await Swal.fire({
    title: "Booking Details",
    html: `
      <div style="font-size:18px;line-height:1.5;color:#4b5563;">
        ${getBookingText(booking)}
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Completed",
    cancelButtonText: "Close",
    confirmButtonColor: "#16A34A",
    cancelButtonColor: "#ED8936",
    width: window.innerWidth < 640 ? "90%" : "420px",
  });

  if (result.isConfirmed) {
    completeBooking(booking);
  }
};

  const formatTime = (time) => {
    if (!time) return "";

    if (String(time).toUpperCase().includes("AM") || String(time).toUpperCase().includes("PM")) {
      return time;
    }

    const [hour, minute] = time.split(":");

    const date = new Date();
    date.setHours(Number(hour));
    date.setMinutes(Number(minute));

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

const getBookingText = (booking) => {
  return `${formatTime(booking.startTime)} - ${formatTime(
    booking.endTime
  )} | ${booking.candidateName} | ${booking.companyName} | ${
    booking.round
  } | ${booking.trainerName || "Trainer Not Assigned"}`;
};

  const filteredBookings = bookings.filter((booking) => {
    const keyword = search.toLowerCase();

    return (
      booking.candidateName?.toLowerCase().includes(keyword) ||
      booking.candidateId?.toLowerCase().includes(keyword) ||
      booking.companyName?.toLowerCase().includes(keyword) ||
      booking.hrName?.toLowerCase().includes(keyword) ||
      booking.status?.toLowerCase().includes(keyword) ||
      booking.trainerName?.toLowerCase().includes(keyword)
    );
  });

  const total = bookings.length;
  const booked = bookings.filter((b) => b.status === "Booked").length;
  const waiting = bookings.filter((b) => b.status === "Waiting List").length;
  const cancelled = bookings.filter((b) => b.status === "Cancelled").length;
  const rescheduled = bookings.filter((b) => b.status === "Rescheduled").length;

  const getStatusClass = (bookingStatus) => {
    if (bookingStatus === "Booked") return "bg-green-100 text-green-700";
    if (bookingStatus === "Waiting List") return "bg-yellow-100 text-yellow-700";
    if (bookingStatus === "Cancelled") return "bg-red-100 text-red-700";
    if (bookingStatus === "Rescheduled") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };
const completeBooking = async (booking) => {
  const result = await Swal.fire({
    icon: "question",
    title: "Mark as Completed?",
    text: "This booking will be removed from admin and candidate dashboard.",
    showCancelButton: true,
    confirmButtonText: "Yes, Complete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#ED8936",
    cancelButtonColor: "#6B7280",
    width: popupWidth,
  });

  if (!result.isConfirmed) return;

  try {
    await API.put("/admin/complete-booking", {
      candidateId: booking.candidateId,
      date: booking.date,
      startTime: booking.startTime,
    });

    await Swal.fire({
      icon: "success",
      title: "Completed",
      text: "Interview is completed.",
      confirmButtonColor: "#ED8936",
      width: popupWidth,
    });

    fetchBookings(status);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Failed",
      text:
        error.response?.data?.message ||
        "Failed to complete booking.",
      confirmButtonColor: "#ED8936",
      width: popupWidth,
    });
  }
};
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <img
                src="/logo.png"
                alt="Genie Tech Consultants"
                className="h-12 object-contain"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>

              <p className="text-sm text-[#F2994A]">
                Interview Booking Management
              </p>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Booked</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{booked}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Waiting List</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {waiting}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Rescheduled</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {rescheduled}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {cancelled}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Booking Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                View, filter and copy booking details.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search candidate, company, HR, trainer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-72 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
              />

              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  fetchBookings(e.target.value);
                }}
                className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
              >
                <option>All</option>
                <option>Booked</option>
                <option>Waiting List</option>
                <option>Rescheduled</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[1350px] text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-4 text-left">Select</th>
                  <th className="px-4 py-4 text-left">Candidate</th>
                  <th className="px-4 py-4 text-left">Phone</th>
                  <th className="px-4 py-4 text-left">Company</th>
                  <th className="px-4 py-4 text-left">HR Name</th>
                  <th className="px-4 py-4 text-left">HR Number</th>
                  <th className="px-4 py-4 text-left">Round</th>
                  <th className="px-4 py-4 text-left">Link</th>
                  <th className="px-4 py-4 text-left">Schedule</th>
                  <th className="px-4 py-4 text-left">Status</th>
                  <th className="px-4 py-4 text-left">Trainer</th>
                  <th className="px-4 py-4 text-left">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="13"
                      className="px-4 py-10 text-center text-gray-500 font-semibold"
                    >
                      Loading bookings...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan="13"
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking, index) => (
                    <>
                      <tr
                        key={`row-${index}`}
                        className="hover:bg-orange-50/40 transition"
                      >
                        <td className="px-4 py-4">
                          <button
  onClick={() => showBookingText(booking)}
  className="rounded-lg border border-[#F2994A] px-3 py-1 text-xs font-semibold text-[#F2994A] hover:bg-orange-50"
>
  View
</button>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-900">
                            {booking.candidateName || "-"}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {booking.candidateId || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          {booking.phone || "-"}
                        </td>

                        <td className="px-4 py-4 font-medium text-gray-900">
                          {booking.companyName || "-"}
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          {booking.hrName || "-"}
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          {booking.hrNumber || "-"}
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          {booking.round || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              booking.linkReceived === "Yes"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {booking.linkReceived || "No"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-gray-700">
  <p>{booking.date || "-"}</p>
  <p className="text-xs text-gray-500">
    {formatTime(booking.startTime) || "-"} -{" "}
    {formatTime(booking.endTime) || "-"}
  </p>
</td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              booking.status
                            )}`}
                          >
                            {booking.status || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          {booking.trainerName || "-"}
                        </td>

                        <td className="px-4 py-4">
  <div className="flex justify-center">
    <button
      onClick={() => assignTrainer(booking)}
      className="rounded-lg bg-[#ED8936] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DD6B20] transition"
    >
      {booking.trainerName ? "Edit" : "Assign"}
    </button>
  </div>
</td>
                      </tr>
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;