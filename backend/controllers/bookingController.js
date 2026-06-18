const {
  findRegisteredCandidate,
  findCandidateDetails,
} = require("../services/googleSheets");

const {
  getEventsByDate,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("../services/googleCalendar");

const {
  saveBooking,
  getBookingHistory,
  updateBooking,
  cancelBooking,
  confirmBookingLink,
  findBookedSlotOwner,
} = require("../services/bookingSheetService");

const { sendBookingConfirmation } = require("../services/emailService");

function formatDate(isoTime) {
  return new Date(isoTime).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(isoTime) {
  return new Date(isoTime).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function convertSheetDateTimeToISO(date, time) {
  const monthMap = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  let yyyy;
  let mm;
  let dd;

  if (date.includes("-")) {
    [yyyy, mm, dd] = date.split("-");
  } else {
    const parts = date.split(" ");
    dd = parts[0].padStart(2, "0");
    mm = monthMap[parts[1]];
    yyyy = parts[2];
  }

  let hour;
  let minute;

  const timeParts = time.trim().split(" ");

  if (timeParts.length === 2) {
    const [h, m] = timeParts[0].split(":");
    hour = Number(h);
    minute = m;

    if (timeParts[1].toUpperCase() === "PM" && hour !== 12) {
      hour += 12;
    }

    if (timeParts[1].toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }
  } else {
    const [h, m] = time.split(":");
    hour = Number(h);
    minute = m;
  }

  return new Date(
    `${yyyy}-${mm}-${dd}T${String(hour).padStart(2, "0")}:${minute}:00+05:30`
  ).toISOString();
}
function isSunday(date) {
  return new Date(`${date}T00:00:00+05:30`).getDay() === 0;
}

function isPastTime(isoTime) {
  return new Date(isoTime).getTime() < new Date().getTime();
}

function formatSlotLabel(start, end) {
  const options = {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return `${new Date(start).toLocaleTimeString("en-IN", options)} - ${new Date(
    end
  ).toLocaleTimeString("en-IN", options)}`;
}
function generateSlots(date, events) {
  const slots = [];
  const startHour = 9;
  const endHour = 21;

  if (isSunday(date)) {
    return [];
  }

  const activeEvents = events.filter((event) => event.status !== "cancelled");

  for (let hour = startHour; hour < endHour; hour++) {
    const slotStart = new Date(
      `${date}T${String(hour).padStart(2, "0")}:00:00+05:30`
    );

    const slotEnd = new Date(
      `${date}T${String(hour + 1).padStart(2, "0")}:00:00+05:30`
    );

    const now = new Date();
    const bufferTime = new Date(now.getTime() + 60 * 60 * 1000);

    const isPastSlot = slotStart.getTime() <= bufferTime.getTime();

    const isBooked = activeEvents.some((event) => {
      if (!event.start?.dateTime || !event.end?.dateTime) return false;

      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      return slotStart < eventEnd && slotEnd > eventStart;
    });

    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      label: formatSlotLabel(slotStart, slotEnd),
      available: !isBooked && !isPastSlot,
      reason: isPastSlot ? "Past Time" : isBooked ? "Booked" : "Available",
    });
  }

  return slots;
}

function isSlotAvailable(startTime, endTime, events, ignoreEventId = null) {
  const selectedStart = new Date(startTime);
  const selectedEnd = new Date(endTime);

  const activeEvents = events.filter((event) => event.status !== "cancelled");

  return !activeEvents.some((event) => {
    if (!event.start?.dateTime || !event.end?.dateTime) return false;

    if (ignoreEventId && event.id === ignoreEventId) {
      return false;
    }

    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);

    return selectedStart < eventEnd && selectedEnd > eventStart;
  });
}

async function getAvailableSlots(req, res) {
  try {
    const { date } = req.query;
    if (isSunday(date)) {
  return res.json({
    date,
    slots: [],
    message: "Sunday slots are closed",
  });
}
    const events = await getEventsByDate(date);
    const slots = generateSlots(date, events);

    res.json({
      date,
      slots,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch slots",
      error: error.message,
    });
  }
}

async function createBooking(req, res) {
  try {
    const {
      candidateId,
      startTime,
      endTime,
      companyName,
      hrName,
      hrNumber,
      round,
      linkReceived,
    } = req.body;

    if (
      !candidateId ||
      !startTime ||
      !endTime ||
      !companyName ||
      !hrName ||
      !hrNumber ||
      !round ||
      !linkReceived
    ) {
      return res.status(400).json({
        message:
          "Candidate ID, company name, HR name, HR number, round, link received, start time and end time are required",
      });
    }
    if (!/^\d{10}$/.test(String(hrNumber).trim())) {
  return res.status(400).json({
    message: "HR Number must contain exactly 10 digits",
  });
}
const bookingDate = startTime.split("T")[0];

if (isSunday(bookingDate)) {
  return res.status(400).json({
    message: "Sunday bookings are closed",
  });
}

if (isPastTime(startTime)) {
  return res.status(400).json({
    message: "Past time slot cannot be booked",
  });
}
    const candidate = await findCandidateDetails(candidateId);

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    const normalizedLinkReceived = String(linkReceived).trim().toLowerCase();
    const status =
      normalizedLinkReceived === "yes" ? "Booked" : "Waiting List";

    const date = startTime.split("T")[0];
    let eventId = "";

    if (normalizedLinkReceived === "yes") {
      const events = await getEventsByDate(date);
      const available = isSlotAvailable(startTime, endTime, events);

      if (!available) {
        return res.status(409).json({
          message: "Slot already booked",
        });
      }

      const event = await createCalendarEvent({
        candidateName: candidate.candidateName,
        candidateId,
        companyName,
        hrName,
        hrNumber,
        round,
        startTime,
        endTime,
      });

      eventId = event.id;

      const registeredCandidate = await findRegisteredCandidate(candidateId);

      if (registeredCandidate?.email) {
        await sendBookingConfirmation(registeredCandidate.email, {
          candidateId,
          candidateName: candidate.candidateName,
          companyName,
          hrName,
          hrNumber,
          round,
          date: formatDate(startTime),
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
        });
      }
    }

    await saveBooking({
      candidateId,
      candidateName: candidate.candidateName,
      date: formatDate(startTime),
      phone: candidate.phone,
      companyName,
      hrName,
      hrNumber,
      round,
      linkReceived,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      status,
      eventId,
    });

    res.json({
      message:
        normalizedLinkReceived === "yes"
          ? "Booking successful"
          : "Booking added to waiting list",
      status,
      candidate,
    });
  } catch (error) {
    res.status(500).json({
      message: "Booking failed",
      error: error.message,
    });
  }
}

async function bookingHistory(req, res) {
  try {
    const { candidateId } = req.params;
    const bookings = await getBookingHistory(candidateId);

    res.json({
      candidateId,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch booking history",
      error: error.message,
    });
  }
}

async function confirmLinkController(req, res) {
  try {
    const { candidateId, date, startTime } = req.body;

    if (!candidateId || !date || !startTime) {
      return res.status(400).json({
        message: "Candidate ID, date and start time are required",
      });
    }

    const candidate = await findCandidateDetails(candidateId);

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    const bookings = await getBookingHistory(candidateId);

    const booking = bookings.find(
      (b) =>
        String(b.date).trim() === String(date).trim() &&
        String(b.startTime).trim() === String(startTime).trim()
    );

    if (!booking) {
      return res.status(404).json({
        message: "Waiting list booking not found",
      });
    }

    if (booking.status !== "Waiting List") {
      return res.status(400).json({
        message: "Only waiting list bookings can be confirmed",
      });
    }

    const confirmStartTime = convertSheetDateTimeToISO(
      booking.date,
      booking.startTime
    );

    const confirmEndTime = convertSheetDateTimeToISO(
      booking.date,
      booking.endTime
    );

    const calendarDate = confirmStartTime.split("T")[0];
    const events = await getEventsByDate(calendarDate);

    const available = isSlotAvailable(
      confirmStartTime,
      confirmEndTime,
      events
    );

    const bookedOwner = await findBookedSlotOwner(
  confirmStartTime,
  confirmEndTime
);

if (bookedOwner) {
  const sameCandidate =
    String(bookedOwner.candidateId).trim() ===
    String(candidateId).trim();

  return res.status(409).json({
    message: sameCandidate
      ? "This slot is already booked by you. Please reschedule your waiting list booking."
      : "This slot is already booked by another candidate. Please reschedule your waiting list booking.",
  });
}

    const event = await createCalendarEvent({
      candidateName: booking.candidateName,
      candidateId,
      companyName: booking.companyName,
      hrName: booking.hrName,
      hrNumber: booking.hrNumber,
      round: booking.round,
      startTime: confirmStartTime,
      endTime: confirmEndTime,
    });

    await confirmBookingLink(candidateId, date, startTime, event.id);

    const registeredCandidate = await findRegisteredCandidate(candidateId);

    if (registeredCandidate?.email) {
      await sendBookingConfirmation(registeredCandidate.email, {
        candidateId,
        candidateName: booking.candidateName,
        companyName: booking.companyName,
        hrName: booking.hrName,
        hrNumber: booking.hrNumber,
        round: booking.round,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
    }

    res.json({
      message: "Booking confirmed successfully",
      status: "Booked",
    });
  } catch (error) {
    res.status(500).json({
      message: "Confirm booking failed",
      error: error.message,
    });
  }
}

async function rescheduleBooking(req, res) {
  try {
    const {
      candidateId,
      oldDate,
      oldStartTime,
      newStartTime,
      newEndTime,
      eventId,
      linkReceived,
    } = req.body;

    if (
      !candidateId ||
      !oldDate ||
      !oldStartTime ||
      !newStartTime ||
      !newEndTime
    ) {
      return res.status(400).json({
        message:
          "Candidate ID, old date, old start time, new start time and new end time are required",
      });
    }
const rescheduleDate = newStartTime.split("T")[0];

if (isSunday(rescheduleDate)) {
  return res.status(400).json({
    message: "Sunday bookings are closed",
  });
}

if (isPastTime(newStartTime)) {
  return res.status(400).json({
    message: "Past time slot cannot be selected",
  });
}
    const bookings = await getBookingHistory(candidateId);

    const currentBooking = bookings.find(
      (b) =>
        String(b.date).trim() === String(oldDate).trim() &&
        String(b.startTime).trim() === String(oldStartTime).trim()
    );

    if (!currentBooking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const normalizedLinkReceived = String(
      linkReceived || currentBooking.linkReceived || "No"
    )
      .trim()
      .toLowerCase();

    const isWaitingList = currentBooking.status === "Waiting List";

    const newDate = newStartTime.split("T")[0];
    const events = await getEventsByDate(newDate);

    const available = isSlotAvailable(
      newStartTime,
      newEndTime,
      events,
      eventId || currentBooking.eventId || null
    );

    if (!available) {
      return res.status(409).json({
        message: "New slot already booked",
      });
    }

    if (isWaitingList) {
      if (normalizedLinkReceived === "yes") {
        const event = await createCalendarEvent({
          candidateName: currentBooking.candidateName,
          candidateId,
          companyName: currentBooking.companyName,
          hrName: currentBooking.hrName,
          hrNumber: currentBooking.hrNumber,
          round: currentBooking.round,
          startTime: newStartTime,
          endTime: newEndTime,
        });

        await updateBooking(
  candidateId,
  oldDate,
  oldStartTime,
  formatDate(newStartTime),
  formatTime(newStartTime),
  formatTime(newEndTime),
  "Yes",
  "Booked",
  event.id,
  currentBooking.eventId || ""
);

        const registeredCandidate = await findRegisteredCandidate(candidateId);

        if (registeredCandidate?.email) {
          await sendBookingConfirmation(registeredCandidate.email, {
            candidateId,
            candidateName: currentBooking.candidateName,
            companyName: currentBooking.companyName,
            hrName: currentBooking.hrName,
            hrNumber: currentBooking.hrNumber,
            round: currentBooking.round,
            date: formatDate(newStartTime),
            startTime: formatTime(newStartTime),
            endTime: formatTime(newEndTime),
          });
        }

        return res.json({
          message:
            "Waiting list booking rescheduled and confirmed successfully",
          newStartTime,
          newEndTime,
          status: "Booked",
        });
      }

      await updateBooking(
        candidateId,
        oldDate,
        oldStartTime,
        formatDate(newStartTime),
        formatTime(newStartTime),
        formatTime(newEndTime),
        "No",
        "Waiting List",
        ""
      );

      return res.json({
        message: "Waiting list booking rescheduled successfully",
        newStartTime,
        newEndTime,
        status: "Waiting List",
      });
    }

    if (
      currentBooking.status === "Booked" ||
      currentBooking.status === "Rescheduled"
    ) {
      const currentEventId = eventId || currentBooking.eventId;

      if (currentEventId) {
        await updateCalendarEvent(
          currentEventId,
          newStartTime,
          newEndTime
        );
      }

      await updateBooking(
        candidateId,
        oldDate,
        oldStartTime,
        formatDate(newStartTime),
        formatTime(newStartTime),
        formatTime(newEndTime),
        "Yes",
        "Rescheduled",
        currentEventId || ""
      );

      return res.json({
        message: "Booking rescheduled successfully",
        newStartTime,
        newEndTime,
        status: "Rescheduled",
      });
    }

    res.status(400).json({
      message: "This booking cannot be rescheduled",
    });
  } catch (error) {
    res.status(500).json({
      message: "Reschedule failed",
      error: error.message,
    });
  }
}

async function cancelBookingController(req, res) {
  try {
    const { candidateId, date, startTime, eventId } = req.body;

    if (!candidateId || !date || !startTime) {
      return res.status(400).json({
        message: "Candidate ID, date and start time are required",
      });
    }

    const savedEventId = await cancelBooking(candidateId, date, startTime);
    const finalEventId = eventId || savedEventId;

    if (finalEventId) {
      try {
        await deleteCalendarEvent(finalEventId);
      } catch (calendarError) {
        console.warn("Calendar delete failed:", calendarError.message);
      }
    }

    res.json({
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Cancel booking failed",
      error: error.message,
    });
  }
}

module.exports = {
  getAvailableSlots,
  createBooking,
  bookingHistory,
  confirmLinkController,
  rescheduleBooking,
  cancelBookingController,
};