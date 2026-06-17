const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
  credentials: {
    project_id: process.env.GOOGLE_PROJECT_ID,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const BOOKINGS_RANGE = "Bookings!A:O";
const TRAINERS_RANGE = "Trainers!A:B";

async function getSheetsClient() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

function getStatusFromLinkReceived(linkReceived) {
  return String(linkReceived).trim().toLowerCase() === "yes"
    ? "Booked"
    : "Waiting List";
}

function mapRowToBooking(row) {
  return {
    candidateId: row[0],
    candidateName: row[1],
    date: row[2],
    phone: row[3],
    companyName: row[4],
    hrName: row[5],
    hrNumber: row[6],
    round: row[7],
    linkReceived: row[8],
    startTime: row[9],
    endTime: row[10],
    status: row[11],
    eventId: row[12] || "",
    trainerName: row[13] || ""
  };
}

async function saveBooking(data) {
  const sheets = await getSheetsClient();

  const linkReceived = data.linkReceived || "No";
  const status = data.status || getStatusFromLinkReceived(linkReceived);

  const values = [
    [
      data.candidateId,
      data.candidateName,
      data.date,
      data.phone,
      data.companyName,
      data.hrName,
      data.hrNumber,
      data.round,
      linkReceived,
      data.startTime,
      data.endTime,
      status,
      data.eventId || "",
      data.trainerName || "",
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
    valueInputOption: "USER_ENTERED",
    resource: { values },
  });
}

function normalizeDate(date) {
  const monthMap = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };

  const cleanDate = String(date || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return cleanDate;

  const parts = cleanDate.split(" ");

  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = monthMap[parts[1]];
    const year = parts[2];

    if (month && year) return `${year}-${month}-${day}`;
  }

  return "";
}

function normalizeTime(time) {
  const cleanTime = String(time || "").trim();

  if (!cleanTime) return "00:00";

  const ampmMatch = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const minute = ampmMatch[2];
    const meridian = ampmMatch[3].toUpperCase();

    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  const hourMinuteMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/);

  if (hourMinuteMatch) {
    return `${String(Number(hourMinuteMatch[1])).padStart(2, "0")}:${
      hourMinuteMatch[2]
    }`;
  }

  return "00:00";
}

function convertToDateTime(date, startTime) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(startTime);

  if (!normalizedDate) return new Date(0);

  return new Date(`${normalizedDate}T${normalizedTime}:00+05:30`);
}

function getTodayStart() {
  const now = new Date();

  return new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );
}

function getFutureSortedBookings(bookings) {
  const now = getTodayStart();

  return bookings
  .filter((booking) => {
  const status = String(booking.status || "").trim().toLowerCase();
  return status !== "completed";
})
    .filter((booking) => {
      const bookingDateTime = convertToDateTime(
        booking.date,
        booking.startTime
      );

      return bookingDateTime >= now;
    })
    .sort((a, b) => {
      const dateA = convertToDateTime(a.date, a.startTime);
      const dateB = convertToDateTime(b.date, b.startTime);

      return dateA - dateB;
    });
}

async function getBookingHistory(candidateId) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = response.data.values || [];
  const dataRows = rows.slice(1);

  const bookings = dataRows
    .filter(
      (row) =>
        String(row[0]).trim() === String(candidateId).trim()
    )
    .map(mapRowToBooking);

  return getFutureSortedBookings(bookings);
}

async function updateBooking(
  candidateId,
  oldDate,
  oldStartTime,
  newDate,
  newStartTime,
  newEndTime,
  newLinkReceived,
  newStatus,
  newEventId
) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = response.data.values || [];

  let rowIndex = -1;

  rows.forEach((row, index) => {
    const sameCandidate =
      String(row[0]).trim() === String(candidateId).trim();

    const sameDate =
      String(row[2]).trim() === String(oldDate).trim();

    const sameStartTime =
      String(row[9]).trim() === String(oldStartTime).trim();

    if (sameCandidate && sameDate && sameStartTime) {
      rowIndex = index + 1;
    }
  });

  if (rowIndex === -1) {
    throw new Error("Booking row not found in sheet");
  }

  const oldRow = rows[rowIndex - 1];

  const oldStatus = oldRow[11];
  const oldLinkReceived = oldRow[8];

  let updatedStatus = "Rescheduled";

  if (
    String(oldStatus).trim().toLowerCase() === "waiting list" ||
    String(oldLinkReceived).trim().toLowerCase() === "no"
  ) {
    updatedStatus = "Waiting List";
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: `Bookings!C${rowIndex}:O${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [
        [
          newDate,
          oldRow[3],
          oldRow[4],
          oldRow[5],
          oldRow[6],
          oldRow[7],
          newLinkReceived || oldRow[8],
          newStartTime,
          newEndTime,
          newStatus || updatedStatus,
          newEventId || oldRow[12] || "",
          oldRow[13] || "",
          oldRow[14] || "",
        ],
      ],
    },
  });
}

async function cancelBooking(candidateId, date, startTime) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = response.data.values || [];

  let rowIndex = -1;
  let eventId = "";

  rows.forEach((row, index) => {
    const sameCandidate =
      String(row[0]).trim() === String(candidateId).trim();

    const sameDate =
      String(row[2]).trim() === String(date).trim();

    const sameStartTime =
      String(row[9]).trim() === String(startTime).trim();

    if (sameCandidate && sameDate && sameStartTime) {
      rowIndex = index + 1;
      eventId = row[12] || "";
    }
  });

  if (rowIndex === -1) {
    throw new Error("Booking row not found");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: `Bookings!L${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [["Cancelled"]],
    },
  });

  return eventId;
}

async function confirmBookingLink(candidateId, date, startTime, eventId) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = response.data.values || [];

  let rowIndex = -1;

  rows.forEach((row, index) => {
    const sameCandidate =
      String(row[0]).trim() === String(candidateId).trim();

    const sameDate =
      String(row[2]).trim() === String(date).trim();

    const sameStartTime =
      String(row[9]).trim() === String(startTime).trim();

    if (sameCandidate && sameDate && sameStartTime) {
      rowIndex = index + 1;
    }
  });

  if (rowIndex === -1) {
    throw new Error("Booking row not found");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: `Bookings!I${rowIndex}:M${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [
        [
          "Yes",
          rows[rowIndex - 1][9],
          rows[rowIndex - 1][10],
          "Booked",
          eventId || rows[rowIndex - 1][12] || "",
        ],
      ],
    },
  });

  return true;
}

async function getAllBookings(status) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = response.data.values || [];
  const dataRows = rows.slice(1);

  let bookings = dataRows.map(mapRowToBooking);

  if (status && status !== "All") {
    bookings = bookings.filter(
      (booking) =>
        String(booking.status).trim().toLowerCase() ===
        String(status).trim().toLowerCase()
    );
  }

  return getFutureSortedBookings(bookings);
}

async function findBookedSlotOwner(startTime, endTime) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = response.data.values || [];
  const dataRows = rows.slice(1);

  const selectedStart = new Date(startTime);
  const selectedEnd = new Date(endTime);

  for (const row of dataRows) {
    const booking = mapRowToBooking(row);

    const status = String(booking.status || "").trim().toLowerCase();

    if (status === "cancelled" || status === "waiting list") {
      continue;
    }

    const bookingStart = convertToDateTime(
      booking.date,
      booking.startTime
    );

    const bookingEnd = convertToDateTime(
      booking.date,
      booking.endTime
    );

    const isOverlapping =
      selectedStart < bookingEnd && selectedEnd > bookingStart;

    if (isOverlapping) {
      return booking;
    }
  }

  return null;
}

async function getAllTrainers() {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: TRAINERS_RANGE,
  });

  const rows = response.data.values || [];
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => row[0] && row[1])
    .map((row) => ({
      trainerName: row[0],
      trainerNumber: row[1],
    }));
}

async function getTrainerByName(trainerName) {
  const trainers = await getAllTrainers();

  return (
    trainers.find(
      (trainer) =>
        String(trainer.trainerName).trim().toLowerCase() ===
        String(trainerName).trim().toLowerCase()
    ) || null
  );
}

async function assignTrainer(
  candidateId,
  date,
  startTime,
  trainerName
) {
  const sheets = await getSheetsClient();

  const trainer = await getTrainerByName(trainerName);

  if (!trainer) {
    throw new Error("Trainer not found");
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = response.data.values || [];

  let rowIndex = -1;
  let booking = null;

  rows.forEach((row, index) => {
    const sameCandidate =
      String(row[0]).trim() === String(candidateId).trim();

    const sameDate =
      String(row[2]).trim() === String(date).trim();

    const sameStartTime =
      String(row[9]).trim() === String(startTime).trim();

    if (sameCandidate && sameDate && sameStartTime) {
      rowIndex = index + 1;
      booking = mapRowToBooking(row);
    }
  });

  if (rowIndex === -1) {
    throw new Error("Booking row not found");
  }

  const oldTrainerName = booking.trainerName || "";

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: `Bookings!N${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[trainer.trainerName]]
    },
  });

  return {
  ...booking,
  trainerName: trainer.trainerName,
  isTrainerChanged: Boolean(oldTrainerName),
};
}
async function completeBooking(candidateId, date, startTime) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = response.data.values || [];

  let rowIndex = -1;

  rows.forEach((row, index) => {
    const sameCandidate =
      String(row[0]).trim() === String(candidateId).trim();

    const sameDate =
      String(row[2]).trim() === String(date).trim();

    const sameStartTime =
      String(row[9]).trim() === String(startTime).trim();

    if (sameCandidate && sameDate && sameStartTime) {
      rowIndex = index + 1;
    }
  });

  if (rowIndex === -1) {
    throw new Error("Booking row not found");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.BOOKING_DETAILS_SHEET_ID,
    range: `Bookings!L${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [["Completed"]],
    },
  });

  return true;
}
module.exports = {
  saveBooking,
  getBookingHistory,
  getAllBookings,
  updateBooking,
  cancelBooking,
  confirmBookingLink,
  findBookedSlotOwner,
  getAllTrainers,
  getTrainerByName,
  assignTrainer,
  completeBooking,
};