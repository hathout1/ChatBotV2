import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeVectorStore } from "./src/vectorstore/inmemory.js";
import { retrieveAnswer } from "./src/retriever.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// جهّز ال VectorStore
await initializeVectorStore();

app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body;

    const answer = await retrieveAnswer(question);

    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating answer" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
