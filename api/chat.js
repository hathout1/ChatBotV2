import { initOpenAI } from "../src/embeddings.js";
import { InMemoryVectorStore } from "../src/vectorstore/inmemory.js";
import { answerQuery } from "../src/retriever.js";

// Initialize OpenAI client and vector store once per serverless instance
const openai = initOpenAI();
const store = new InMemoryVectorStore();

export default async function handler(req, res) {
  // Basic CORS handling so Angular (or any frontend) can call this endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { query, context } = req.body || {};
    if (!query) {
      res.status(400).json({ error: "query required" });
      return;
    }

    const response = await answerQuery(openai, store, query, context);
    res.status(200).json({ ok: true, answer: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
