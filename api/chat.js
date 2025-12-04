import { initOpenAI } from "../src/embeddings.js";
import { MysqlVectorStore } from "../src/vectorstore/mysql.js";
import { answerQuery } from "../src/retriever.js";
import dotenv from "dotenv";

dotenv.config();

let openai = null;
let store = null;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req, res) {
  // handle preflight
  if (req.method === "OPTIONS") {
    setCors(res);
    return res.status(204).end();
  }

  setCors(res);
  if (req.method !== "POST") return res.status(405).end();
  try {
    // lazy init clients to avoid module-init failures in serverless env
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

    const { query, context } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });
    const answer = await answerQuery(openai, store, query, context);
    res.json({ ok: true, answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
