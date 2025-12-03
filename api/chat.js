export const config = {
  runtime: "edge",
};

import { initOpenAI } from "../src/embeddings.js";
import { InMemoryVectorStore } from "../src/vectorstore/inmemory.js";
import { answerQuery } from "../src/retriever.js";

const openai = initOpenAI();
const store = new InMemoryVectorStore();

export default async function handler(req) {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const { query, context } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "query required" }), {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const answer = await answerQuery(openai, store, query, context);

    return new Response(JSON.stringify({ ok: true, answer }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}
