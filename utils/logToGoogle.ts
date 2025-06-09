import { google } from "googleapis";

export async function logToGoogleSheet(
  tenant: string,
  message: string,
  intent: string,
  response: string
) {
  const auth = new google.auth.GoogleAuth({
    credentials: require("../google-credentials.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // 📌 Vul hier jouw Google Sheet ID in:
  const spreadsheetId = "1kDPD1zOulVsDRrBiWKKwVoEmZLUqc-8wHK9VLorX39A";

  const now = new Date().toISOString();
  const sheetName = tenant || "algemeen";

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[now, message, intent, response]],
      },
    });
  } catch (err) {
    console.error("Loggen naar Google Sheet mislukt:", err);
  }
}

