import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

function Booking() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [hrName, setHrName] = useState("");
  const [hrNumber, setHrNumber] = useState("");
  const [round, setRound] = useState("");
  const [linkReceived, setLinkReceived] = useState("");

  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);

  const navigate = useNavigate();

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

  const fetchSlots = async () => {
    if (!date) {
      Swal.fire({
  icon: "warning",
  title: "Date Required",
  text: "Please select a date.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
      return;
    }

    if (isPastDate(date)) {
      Swal.fire({
  icon: "warning",
  title: "Invalid Date",
  text: "Past date cannot be selected.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
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
      Swal.fire({
  icon: "error",
  title: "Error",
  text: "Failed to load slots.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
    } finally {
      setSlotLoading(false);
    }
  };

  const bookSlot = async () => {
    if (
      !companyName.trim() ||
      !hrName.trim() ||
      !hrNumber.trim() ||
      !round.trim() ||
      !linkReceived
    )
    {
      Swal.fire({
  icon: "warning",
  title: "Missing Details",
  text: "Please enter company name, HR name, HR number, round and link received status.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
      return;
    }

    if (!selectedSlot && (!date || !customStart || !customEnd)) {
      Swal.fire({
  icon: "warning",
  title: "Slot Required",
  text: "Select a slot or enter custom start and end time.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
      return;
    }
    if (!/^\d{10}$/.test(hrNumber)) {
  Swal.fire({
    icon: "warning",
    title: "Invalid HR Number",
    text: "HR Number must contain exactly 10 digits.",
    confirmButtonColor: "#ED8936",
    width: window.innerWidth < 640 ? "90%" : "380px",
  });
  return;
}

    if (isPastDate(date)) {
      Swal.fire({
  icon: "warning",
  title: "Invalid Date",
  text: "Past date cannot be booked.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
      return;
    }

    if (isSunday(date)) {
      alert("Sunday bookings are closed");
      return;
    }

    let startTime;
    let endTime;

    if (selectedSlot) {
      startTime = selectedSlot.startTime;
      endTime = selectedSlot.endTime;
    } else {
      if (customStart >= customEnd) {
        Swal.fire({
  icon: "warning",
  title: "Invalid Time",
  text: "End time must be after start time.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
        return;
      }

      if (isPastDateTime(date, customStart)) {
        Swal.fire({
  icon: "warning",
  title: "Invalid Time",
  text: "Past time slot cannot be booked.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
});
        return;
      }

      startTime = new Date(`${date}T${customStart}:00+05:30`).toISOString();
      endTime = new Date(`${date}T${customEnd}:00+05:30`).toISOString();
    }

    try {
      setLoading(true);

      const candidateId = localStorage.getItem("candidateId");

      const response = await API.post("/booking/create", {
        candidateId,
        companyName,
        hrName,
        hrNumber,
        round,
        linkReceived,
        startTime,
        endTime,
      });

      Swal.fire({
  icon: "success",
  title: "Booking Successful",
  text: response.data.message || "Booking completed successfully.",
  confirmButtonColor: "#ED8936",
  width: window.innerWidth < 640 ? "90%" : "380px",
}).then(() => {
  navigate("/dashboard");
});
return;
    } catch (error) {
  Swal.fire({
    icon: "error",
    title: "Booking Failed",
    text: error.response?.data?.message || "Booking failed.",
    confirmButtonColor: "#ED8936",
    width: window.innerWidth < 640 ? "90%" : "380px",
  });
}finally {
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
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-[#F2994A] px-5 py-2 text-sm font-semibold text-[#F2994A] hover:bg-orange-50 transition"
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
            Book Interview Slot
          </h2>

          <p className="text-gray-500 mt-2">
            Select an available slot or enter a custom interview time.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-5">
              Select Date & Slot
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
                className="rounded-xl bg-[#ED8936] px-6 py-3 font-semibold text-white shadow-md hover:bg-[#DD6B20] hover:shadow-lg transition duration-200"
              >
                {slotLoading ? "Loading..." : "View Slots"}
              </button>
            </div>

            {date && isSunday(date) && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                Sunday slots are closed. Please select another date.
              </div>
            )}

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
                      {slot.reason || (slot.available ? "Available" : "Booked")}
                    </p>
                  </button>
                ))}
              </div>
            )}

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
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
            <h3 className="text-xl font-bold text-gray-900 mb-5">
              Booking Details
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              />

              <input
                type="text"
                placeholder="HR Name"
                value={hrName}
                onChange={(e) => setHrName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              />

              <input
  type="tel"
  placeholder="HR Number (10 digits)"
  value={hrNumber}
  maxLength={10}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "");
    setHrNumber(value);
  }}
  className="w-full rounded-lg border border-gray-300 px-4 py-3"
/>

              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#F2994A] focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Select Round</option>
                <option value="Level-1">Level-1</option>
                <option value="Level-2">Level-2</option>
                <option value="Level-3">Level-3</option>
                <option value="Assessment">Assessment</option>
                <option value="HR Discussion">HR Discussion</option>
                <option value="Client Discussion">Client Discussion</option>
                <option value="Screening">Screening</option>
                <option value="Telephonic">Telephonic</option>
              </select>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Link Received
                </label>

                <select
                  value={linkReceived}
                  onChange={(e) => setLinkReceived(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <button
  onClick={bookSlot}
  disabled={loading}
  className="w-full rounded-xl bg-[#ED8936] py-3 font-semibold text-white shadow-md hover:bg-[#DD6B20] hover:shadow-lg transition duration-200 disabled:opacity-60"
>
  {loading ? "Booking..." : "Confirm Booking"}
</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Booking;