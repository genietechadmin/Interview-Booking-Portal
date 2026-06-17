import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

function Reschedule() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking;

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [linkReceived, setLinkReceived] = useState(
    booking?.status === "Waiting List" ? "No" : "Yes"
  );

  const [slotLoading, setSlotLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const showAlert = (icon, title, text) => {
  Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: "#ED8936",
    width: window.innerWidth < 640 ? "90%" : "380px",
  });
};

  const isSunday = (selectedDate) => {
    return new Date(`${selectedDate}T00:00:00+05:30`).getDay() === 0;
  };

  const isPastDate = (selectedDate) => {
  const today = new Date();

  const todayIST = new Date(
    today.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  todayIST.setHours(0, 0, 0, 0);

  const selected = new Date(`${selectedDate}T00:00:00`);

  return selected < todayIST;
};

  const isPastDateTime = (selectedDate, timeValue) => {
    const selectedDateTime = new Date(`${selectedDate}T${timeValue}:00+05:30`);
    return selectedDateTime.getTime() < new Date().getTime();
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "";

    const [hour, minute] = timeValue.split(":");

    return new Date(`2000-01-01T${hour}:${minute}:00`).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900">
            No booking selected
          </h2>

          <p className="text-gray-500 mt-2">
            Please go back to dashboard and choose a booking to reschedule.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 rounded-lg bg-[#F2994A] px-5 py-3 font-semibold text-white hover:bg-[#e88a35]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const fetchSlots = async () => {
    if (!date) {
      showAlert("warning", "Date Required", "Please select a date.");
      return;
    }

    if (isPastDate(date)) {
      showAlert("warning", "Invalid Date", "Past date cannot be selected.");
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    if (isSunday(date)) {
      alert("Sunday slots are closed");
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    try {
      setSlotLoading(true);

      const response = await API.get(`/booking/slots?date=${date}`);

      setSlots(response.data.slots || []);
      setSelectedSlot(null);
    } catch {
      showAlert("error", "Error", "Failed to load slots.");
    } finally {
      setSlotLoading(false);
    }
  };

  const reschedule = async () => {
    if (!selectedSlot && (!date || !customStart || !customEnd)) {
      showAlert("warning", "Slot Required", "Select a slot or enter custom start and end time.");
      return;
    }

    if (isPastDate(date)) {
     showAlert("warning", "Invalid Date", "Past date cannot be selected.");
      return;
    }

    if (isSunday(date)) {
      alert("Sunday bookings are closed");
      return;
    }

    let newStartTime;
    let newEndTime;

    if (selectedSlot) {
      newStartTime = selectedSlot.startTime;
      newEndTime = selectedSlot.endTime;
    } else {
      if (customStart >= customEnd) {
        showAlert("warning", "Invalid Time", "End time must be after start time.");
        return;
      }

      if (isPastDateTime(date, customStart)) {
        showAlert("warning", "Invalid Time", "Past time slot cannot be selected.");
        return;
      }

      newStartTime = new Date(`${date}T${customStart}:00+05:30`).toISOString();
      newEndTime = new Date(`${date}T${customEnd}:00+05:30`).toISOString();
    }

    try {
      setLoading(true);

      const response = await API.post("/booking/reschedule", {
        candidateId: booking.candidateId,
        oldDate: booking.date,
        oldStartTime: booking.startTime,
        newStartTime,
        newEndTime,
        eventId: booking.eventId,
        linkReceived,
      });

      Swal.fire({
  icon: "success",
  title: "Rescheduled",
  text: response.data.message || "Booking rescheduled successfully.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
}).then(() => {
  navigate("/dashboard");
});
      navigate("/dashboard");
    } catch (error) {
      showAlert(
  "error",
  "Reschedule Failed",
  error.response?.data?.message || "Reschedule failed."
);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <img
                src="/logo.png"
                alt="Genie Tech Consultants"
                className="h-10 object-contain"
              />
            </div>

            <h1 className="text-2xl font-bold text-[#F2994A]">
              Interview Portal
            </h1>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#F2994A]">
            Interview Scheduling
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-1">
            Reschedule Interview
          </h2>

          <p className="text-gray-500 mt-2">
            Choose a new available slot or enter a custom time.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <aside className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
            <h3 className="text-xl font-bold text-gray-900 mb-5">
              Current Booking
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Company</p>
                <p className="font-semibold text-gray-900">
                  {booking.companyName}
                </p>
              </div>

              <div>
                <p className="text-gray-500">HR Name</p>
                <p className="font-semibold text-gray-900">{booking.hrName}</p>
              </div>

              <div>
                <p className="text-gray-500">HR Number</p>
                <p className="font-semibold text-gray-900">
                  {booking.hrNumber}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Round</p>
                <p className="font-semibold text-gray-900">{booking.round}</p>
              </div>

              <div>
                <p className="text-gray-500">Current Date</p>
                <p className="font-semibold text-gray-900">{booking.date}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500">Start</p>
                  <p className="font-semibold text-gray-900">
                    {booking.startTime}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500">End</p>
                  <p className="font-semibold text-gray-900">
                    {booking.endTime}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-500">Status</p>
                <span className="inline-block mt-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  {booking.status}
                </span>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-5">
              Select New Slot
            </h3>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="date"
                min={getTodayDate()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlots([]);
                  setSelectedSlot(null);
                  setCustomStart("");
                  setCustomEnd("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
              />

              <button
                onClick={fetchSlots}
                disabled={slotLoading}
                className="rounded-lg bg-[#1A1A1A] px-5 py-3 font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {slotLoading ? "Loading..." : "View Slots"}
              </button>
            </div>

            {date && isSunday(date) && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                Sunday slots are closed. Please select another date.
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Available Slots
              </h4>

              {slots.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
                  Select a date and click View Slots.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {slots.map((slot, index) => (
                    <button
                      key={index}
                      disabled={!slot.available}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setCustomStart("");
                        setCustomEnd("");
                      }}
                      className={`rounded-xl border px-4 py-4 text-left transition ${
                        selectedSlot?.startTime === slot.startTime
                          ? "border-[#F2994A] bg-orange-50 shadow"
                          : slot.available
                          ? "border-gray-200 bg-white hover:border-[#F2994A]"
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <p className="font-bold">{slot.label}</p>
                      <p className="text-sm mt-1">
                        {slot.reason ||
                          (slot.available ? "Available" : "Booked")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-800 mb-3">
                Or Enter Custom Time
              </h4>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={customStart}
                    onChange={(e) => {
                      setCustomStart(e.target.value);
                      setSelectedSlot(null);
                    }}
                    disabled={!date || isSunday(date)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time
                  </label>

                  <input
                    type="time"
                    value={customEnd}
                    onChange={(e) => {
                      setCustomEnd(e.target.value);
                      setSelectedSlot(null);
                    }}
                    disabled={!date || isSunday(date)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              {customStart && customEnd && (
                <p className="mt-3 text-sm text-gray-500">
                  Selected custom time:{" "}
                  <span className="font-semibold text-gray-900">
                    {formatTime(customStart)} - {formatTime(customEnd)}
                  </span>
                </p>
              )}

              <p className="text-xs text-gray-500 mt-3">
                Custom reschedule times automatically check overlapping slots.
              </p>
            </div>

            {booking.status === "Waiting List" && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Interview Link Received?
                </label>

                <select
                  value={linkReceived}
                  onChange={(e) => setLinkReceived(e.target.value)}
                  className="w-full max-w-sm rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>

                <p className="text-xs text-gray-500 mt-2">
                  If "Yes", the slot will be confirmed immediately after
                  rescheduling.
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={reschedule}
                disabled={loading}
                className="rounded-lg bg-[#F2994A] px-6 py-3 font-semibold text-white hover:bg-[#e88a35] transition disabled:opacity-60"
              >
                {loading ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Reschedule;