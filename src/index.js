import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { initOpenAI } from "./embeddings.js";
import { InMemoryVectorStore } from "./vectorstore/inmemory.js";
import { answerQuery, ingestDocument } from "./retriever.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize OpenAI client and vector store
const openai = initOpenAI();
const store = new InMemoryVectorStore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve the simple UI from /public
app.use(express.static("public"));

// Health
app.get("/health", (req, res) => res.send("RAG Chatbot running"));

// Ingest a document: { id, text, metadata }
app.post("/ingest", async (req, res) => {
  try {
    const { id, text, metadata } = req.body;
    if (!id || !text)
      return res.status(400).json({ error: "id and text required" });
    const doc = await ingestDocument(openai, store, { id, text, metadata });
    res.json({ ok: true, doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Chat endpoint: { query }
// Chat endpoint: accepts { query, context } where context is optional document text
app.post("/chat", async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });

    // If the client provided a document to chat with, pass it to the retriever
    // without saving it to the persistent in-memory store.
    const response = await answerQuery(openai, store, query, context);
    res.json({ ok: true, answer: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`RAG Chatbot running on http://localhost:${PORT}`);
});
