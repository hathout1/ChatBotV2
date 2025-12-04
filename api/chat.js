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
    // If a browser visits /chat via GET, return a tiny instructions page instead of 405
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><title>/chat - RAG Chatbot</title></head><body><h1>/chat - RAG Chatbot</h1><p>This endpoint accepts <strong>POST</strong> requests with JSON body <code>{ "query": "...", "context": "..." }</code>.</p><p>Use your Angular app or curl to POST to this endpoint. Example:</p><pre>curl -X POST https://your-domain.vercel.app/chat -H "Content-Type: application/json" -d '{"query":"where is the first offer"}'</pre></body></html>`);
    }
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
