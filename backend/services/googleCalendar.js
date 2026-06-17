const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  credentials: {
    project_id: process.env.GOOGLE_PROJECT_ID,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

async function getCalendarClient() {
  const client = await auth.getClient();

  return google.calendar({
    version: "v3",
    auth: client,
  });
}

async function getEventsByDate(date) {
  const calendar = await getCalendarClient();

  const timeMin = new Date(`${date}T00:00:00+05:30`).toISOString();
  const timeMax = new Date(`${date}T23:59:59+05:30`).toISOString();

  const response = await calendar.events.list({
    calendarId: process.env.OWNER_CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

async function createCalendarEvent({
  candidateName,
  candidateId,
  companyName,
  hrName,
  hrNumber,
  round,
  startTime,
  endTime,
}) {
  const calendar = await getCalendarClient();

  const event = {
    summary: `${candidateName} | ${companyName} | ${round} Interview`,

    description: `
Candidate Name : ${candidateName}
Candidate ID   : ${candidateId}

Company Name   : ${companyName}
HR Name        : ${hrName}
HR Number      : ${hrNumber}
Round          : ${round}
    `,

    start: {
      dateTime: startTime,
      timeZone: "Asia/Kolkata",
    },

    end: {
      dateTime: endTime,
      timeZone: "Asia/Kolkata",
    },

    extendedProperties: {
      private: {
        candidateId: String(candidateId),
        companyName: String(companyName),
        round: String(round),
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: process.env.OWNER_CALENDAR_ID,
    resource: event,
  });

  console.log("Calendar event created:", response.data.id);

  return response.data;
}

async function findCalendarEventByBooking(candidateId, date, startTime) {
  const events = await getEventsByDate(date);

  const matchedEvent = events.find((event) => {
    const eventCandidateId =
      event.extendedProperties?.private?.candidateId;

    const eventStartTime = new Date(event.start.dateTime).toLocaleTimeString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );

    const normalizedEventTime = eventStartTime
      .replace(/\s/g, "")
      .toLowerCase();

    const normalizedSheetTime = String(startTime)
      .replace(/\s/g, "")
      .toLowerCase();

    return (
      String(eventCandidateId).trim() === String(candidateId).trim() &&
      normalizedEventTime === normalizedSheetTime
    );
  });

  return matchedEvent || null;
}

async function deleteCalendarEventByBooking(candidateId, date, startTime) {
  const calendar = await getCalendarClient();

  const event = await findCalendarEventByBooking(
    candidateId,
    date,
    startTime
  );

  if (!event) {
    console.log("No matching calendar event found for cancellation");
    return false;
  }

  await calendar.events.delete({
    calendarId: process.env.OWNER_CALENDAR_ID,
    eventId: event.id,
  });

  console.log("Calendar event deleted:", event.id);

  return true;
}

async function updateCalendarEvent(eventId, startTime, endTime) {
  const calendar = await getCalendarClient();

  const event = await calendar.events.get({
    calendarId: process.env.OWNER_CALENDAR_ID,
    eventId,
  });

  event.data.start = {
    dateTime: startTime,
    timeZone: "Asia/Kolkata",
  };

  event.data.end = {
    dateTime: endTime,
    timeZone: "Asia/Kolkata",
  };

  const updatedEvent = await calendar.events.update({
    calendarId: process.env.OWNER_CALENDAR_ID,
    eventId,
    resource: event.data,
  });

  return updatedEvent.data;
}

async function deleteCalendarEvent(eventId) {
  const calendar = await getCalendarClient();

  await calendar.events.delete({
    calendarId: process.env.OWNER_CALENDAR_ID,
    eventId,
  });

  return true;
}

module.exports = {
  getEventsByDate,
  createCalendarEvent,
  findCalendarEventByBooking,
  deleteCalendarEventByBooking,
  updateCalendarEvent,
  deleteCalendarEvent,
};