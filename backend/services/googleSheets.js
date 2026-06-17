const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../credentials/service-account.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetRows(spreadsheetId, range) {
  const client = await auth.getClient();

  const sheets = google.sheets({
    version: "v4",
    auth: client,
  });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

async function findRegisteredCandidate(candidateId) {
  const rows = await getSheetRows(
    process.env.REGISTERED_SHEET_ID,
    "'Form Responses 1'!A:N"
  );

  const dataRows = rows.slice(1);

  const candidate = dataRows.find(
    (row) =>
      String(row[13]).trim() === String(candidateId).trim()
  );

  if (!candidate) return null;

  return {
    candidateId: candidate[13],
    email: candidate[12],
  };
}

async function findCandidateDetails(candidateId) {
  const rows = await getSheetRows(
    process.env.CANDIDATE_DETAILS_SHEET_ID,
    "'Candidates List'!A:C"
  );

  const dataRows = rows.slice(1);

  const candidate = dataRows.find(
    (row) =>
      String(row[0]).trim() === String(candidateId).trim()
  );

  if (!candidate) return null;

  return {
    candidateId: candidate[0],
    candidateName: candidate[1],
    phone: candidate[2],
  };
}

module.exports = {
  getSheetRows,
  findRegisteredCandidate,
  findCandidateDetails,
};