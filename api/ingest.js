import dotenv from "dotenv";
import { initOpenAI, embedText } from "../src/embeddings.js";
import { MysqlVectorStore } from "../src/vectorstore/mysql.js";

dotenv.config();

let openai = null;
let store = null;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    setCors(res);
    return res.status(204).end();
  }
  setCors(res);
  if (req.method !== "POST") return res.status(405).end();
  try {
    if (!openai) {
      try {
        openai = initOpenAI();
      } catch (e) {
        console.error("OpenAI init error:", e);
        return res.status(500).json({ error: "OpenAI init error" });
      }
    }
    if (!store) {
      try {
        store = new MysqlVectorStore();
      } catch (e) {
        console.error("MySQL store init error:", e);
        return res.status(500).json({ error: "MySQL store init error" });
      }
    }

    const { id, text, metadata } = req.body;
    if (!id || !text)
      return res.status(400).json({ error: "id and text required" });
    const embedding = await embedText(openai, text);
    await store.add({ id, text, embedding, metadata });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
