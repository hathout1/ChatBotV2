#!/usr/bin/env node
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { initOpenAI, embedText } from "../src/embeddings.js";
import { MysqlVectorStore } from "../src/vectorstore/mysql.js";

dotenv.config();

const openai = initOpenAI();
const store = new MysqlVectorStore();

async function main() {
  const file = path.resolve(process.env.SEED_FILE || "data.txt");
  if (!fs.existsSync(file)) {
    console.error("Seed file not found:", file);
    process.exit(1);
  }
  const raw = fs.readFileSync(file, "utf8");
  const docs = raw
    .split("\n\n")
    .map((s) => s.trim())
    .filter(Boolean);
  for (let i = 0; i < docs.length; i++) {
    const id = `doc-${i + 1}`;
    const text = docs[i];
    const embedding = await embedText(openai, text);
    await store.add({ id, text, embedding, metadata: { source: "seed" } });
    console.log("seeded", id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
