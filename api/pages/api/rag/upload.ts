// pages/api/rag/upload.ts
import { handleUpload } from "@/utils/rag/uploadHandler";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST toegestaan" });
  }

  const { tenant, content } = req.body;

  if (!tenant || !content) {
    return res.status(400).json({ error: "tenant en content zijn verplicht" });
  }

  try {
    await handleUpload(tenant, content);
    res.status(200).json({ success: true, message: "Upload gelukt" });
  } catch (error) {
    console.error("❌ Upload mislukt:", error);
    res.status(500).json({ error: "Upload faalde", detail: error.message });
  }
}
