import { google } from "googleapis";

export async function logToGoogleSheet(
  tenant: string,
  message: string,
  intent: string,
  response: string,
  userId?: string,
  platform?: string,
  language?: string
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

    const expectedHeaders = [
      "Timestamp",
      "Bericht",
      "Intent",
      "Antwoord",
      "UserID",
      "Platform",
      "Taal",
    ];

    // 1️⃣ Check of tabblad bestaat
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );

    // 2️⃣ Als tabblad niet bestaat → aanmaken + headers toevoegen
    if (!sheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetName },
              },
            },
          ],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:G1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [expectedHeaders],
        },
      });

      console.log(`✅ Nieuw tabblad '${sheetName}' aangemaakt met headers.`);
    } else {
      // 3️⃣ Tabblad bestaat → check of headers kloppen
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:G1`,
      });

      const actualHeaders = headerRes.data.values?.[0] || [];

      const headersMatch = expectedHeaders.every(
        (h, i) => h === actualHeaders[i]
      );

      if (!headersMatch) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:G1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [expectedHeaders],
          },
        });
        console.log(`🛠 Headers van '${sheetName}' bijgewerkt.`);
      }
    }

    // 4️⃣ Voeg de log toe aan de eerste lege rij
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          now,
          message,
          intent,
          response,
          userId || "",
          platform || "",
          language || "",
        ]],
      },
    });

    console.log(`📥 Gelogd naar '${sheetName}': ${now}`);

  } catch (err) {
    console.error("❌ Loggen naar Google Sheet mislukt:", err);
  }
}
