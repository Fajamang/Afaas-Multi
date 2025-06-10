import { google } from "googleapis";

export async function logToGoogleSheet(
  tenant: string,
  message: string,
  intent: string,
  response: string
) {
  try {
    // 👇 Google Service Account credentials ophalen uit ENV
    const rawCredentials = process.env.GOOGLE_CREDENTIALS_JSON;

    if (!rawCredentials) throw new Error("GOOGLE_CREDENTIALS_JSON ontbreekt");

    const credentials = JSON.parse(rawCredentials);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const now = new Date().toISOString();
    const spreadsheetId = "1kDPD1zOulVsDRrBiWKKwVoEmZLUqc-8wHK9VLorX39A";
    const sheetName = tenant || "algemeen";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[now, message, intent, response]],
      },
    });

  } catch (err) {
    console.error("❌ Loggen naar Google Sheet mislukt:", err);
  }
}
