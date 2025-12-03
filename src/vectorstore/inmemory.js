export class InMemoryVectorStore {
  constructor() {
    this.docs = []; // { id, text, embedding, metadata }
  }

  async add(doc) {
    this.docs.push(doc);
  }

  // cosine similarity search
  async search(queryEmbedding, topK = 4) {
    const scores = this.docs.map((d) => ({
      doc: d,
      score: cosineSimilarity(queryEmbedding, d.embedding),
    }));
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK).map((s) => ({ ...s.doc, score: s.score }));
  }
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a) {
  return Math.sqrt(dot(a, a));
}

function cosineSimilarity(a, b) {
  const n = norm(a) * norm(b);
  if (n === 0) return 0;
  return dot(a, b) / n;
}
