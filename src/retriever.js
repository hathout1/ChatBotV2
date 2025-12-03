import fs from "fs";
import path from "path";
import { embedText } from "./embeddings.js";

const TOP_K = parseInt(process.env.TOP_K || "4", 10);
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

// اقرأ البيانات من data.txt مرة واحدة عند بداية تشغيل السيرفر
const dataFilePath = path.join(process.cwd(), "data.txt");
let fileData = "";
try {
  fileData = fs.readFileSync(dataFilePath, "utf-8");
  console.log("Loaded data.txt successfully.");
} catch (err) {
  console.warn("Could not read data.txt:", err.message);
}

export async function ingestDocument(
  openaiClient,
  store,
  { id, text, metadata = {} }
) {
  const embedding = await embedText(openaiClient, text);
  const doc = { id, text, embedding, metadata };
  await store.add(doc);
  return doc;
}

export async function answerQuery(openaiClient, store, query) {
  // 1️⃣ لو فيه data.txt، استخدمها كـ context طبيعي
  if (fileData && fileData.trim()) {
    const systemPrompt = `You are a helpful assistant. Use the following text to answer the user's question. Think carefully and answer naturally. If the answer is not in the text, give your best answer.`;
    const userPrompt = `Text:\n${fileData}\n\nQuestion: ${query}`;

    const resp = await openaiClient.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return resp.choices?.[0]?.message?.content || "";
  }

  // 2️⃣ Embed query و search في الـ vector store
  const qEmbedding = await embedText(openaiClient, query);
  const hits = await store.search(qEmbedding, TOP_K);

  // 3️⃣ Mock fallback
  if (openaiClient?.isMock) {
    if (!hits || hits.length === 0)
      return "I couldn't find any relevant documents to answer that.";
    const top = hits[0];
    return formatPlainAnswer(trimText(top.text || "", 1000));
  }

  // 4️⃣ Fallback لو مفيش hits
  if (!hits || hits.length === 0) {
    const resp = await openaiClient.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: query },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });
    return resp.choices?.[0]?.message?.content || "";
  }

  // 5️⃣ Build context من الـ hits
  const builtContext = hits
    .map(
      (h, i) => `Document ${i + 1} (score: ${h.score.toFixed(3)}):\n${h.text}`
    )
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant. Use the provided context to answer the user's question. If the answer is not contained, say you don't know.`;
  const userPrompt = `Context:\n${builtContext}\n\nQuestion: ${query}\n\nAnswer concisely and cite which Document number(s) you used.`;

  const resp = await openaiClient.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.0,
    max_tokens: 800,
  });

  return resp.choices?.[0]?.message?.content || "";
}

// ---------------- Helper functions ----------------

function formatPlainAnswer(t) {
  if (!t) return t;
  let s = t.trim();
  s = s[0].toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s = s + ".";
  return s;
}

function trimText(t, max) {
  if (!t) return t;
  if (t.length <= max) return t;
  return t.slice(0, max) + "...";
}
