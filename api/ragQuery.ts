// /api/ragQuery.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { queryChunks } from "../../utils/rag/queryChunks"; // 🔁 relatieve import gebruiken

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST is toegestaan" });
  }

  const { tenant, question } = req.body;

  if (!tenant || !question) {
    return res.status(400).json({ error: "tenant en question zijn verplicht" });
  }

  try {
    const results = await queryChunks(tenant, question);

    res.status(200).json({
      success: true,
      context: results,
    });
  } catch (err: any) {
    console.error("❌ Fout in ragQuery:", err.message);
    res.status(500).json({
      error: "Query faalde",
      detail: err.message,
    });
  }
}
