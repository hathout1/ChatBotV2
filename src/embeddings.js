import OpenAI from "openai";

export function initOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "OPENAI_API_KEY not set — running in demo mode with mocked OpenAI client"
    );
    return createMockClient();
  }
  const client = new OpenAI({ apiKey });
  return client;
}

export async function embedText(openaiClient, text) {
  const model = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
  const response = await openaiClient.embeddings.create({ model, input: text });
  return response.data[0].embedding;
}

function createMockClient() {
  const dims = 1536;
  return {
    isMock: true,
    embeddings: {
      create: async ({ model, input }) => {
        const text = Array.isArray(input) ? input[0] : input;
        const embedding = fakeEmbedding(text, dims);
        return { data: [{ embedding }] };
      },
    },
    chat: {
      completions: {
        create: async ({ model, messages }) => {
          const userMsg =
            (messages || []).find((m) => m.role === "user")?.content || "";
          const short =
            userMsg.length > 400 ? userMsg.slice(0, 400) + "..." : userMsg;
          const content = `Demo response (no API key). Based on provided context and question:\n${short}`;
          return { choices: [{ message: { content } }] };
        },
      },
    },
  };
}

function fakeEmbedding(text, dims) {
  // deterministic pseudo-embedding based on a simple hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  }
  const vec = new Array(dims);
  for (let i = 0; i < dims; i++) {
    // generate values in [-1,1]
    vec[i] = Math.sin((h + i) * 0.0001);
  }
  return vec;
}
