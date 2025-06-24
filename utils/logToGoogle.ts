console.log("GOOGLE_CREDENTIALS_JSON aanwezig?", !!process.env.GOOGLE_CREDENTIALS_JSON);
import { google } from "googleapis";

export async function logToGoogleSheet(
  tenant: string,
  message: string,
  intent: string,
  response: string
) {
  try {
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

    // 1️⃣ Check of sheet/tab bestaat
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = meta.data.sheets?.some(
      (sheet) => sheet.properties?.title === sheetName
    );

    // 2️⃣ Voeg sheet toe als die niet bestaat
    if (!sheetExists) {
      console.log(`📄 Sheet '${sheetName}' bestaat nog niet. Wordt aangemaakt...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });
    }

    // 3️⃣ Log de data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[now, message, intent, response]],
      },
    });

    console.log(`✅ Gelogd naar tabblad '${sheetName}'`);

  } catch (err) {
    console.error("❌ Loggen naar Google Sheet mislukt:", err);
  }
}
