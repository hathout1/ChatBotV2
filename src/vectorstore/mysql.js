import { createMysqlPool } from "../db.mysql.js";

const pool = createMysqlPool();

export class MysqlVectorStore {
  constructor() {
    this.pool = pool;
  }

  // doc: { id, text, embedding (array), metadata }
  async add(doc) {
    const conn = await this.pool.getConnection();
    try {
      const embeddingJson = JSON.stringify(doc.embedding || []);
      const metadataJson = doc.metadata ? JSON.stringify(doc.metadata) : null;
      await conn.query(
        `INSERT INTO documents (id, text, embedding, metadata)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE text = VALUES(text), embedding = VALUES(embedding), metadata = VALUES(metadata)`,
        [doc.id, doc.text, embeddingJson, metadataJson]
      );
    } finally {
      conn.release();
    }
  }

  async getById(id) {
    const [rows] = await this.pool.query(
      "SELECT id, text, metadata, created_at FROM documents WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  // queryEmbedding: array of floats
  // For moderate-sized DBs this fetches candidates and computes cosine similarity in JS.
  async search(
    queryEmbedding,
    topK = 4,
    prefilterSql = null,
    prefilterParams = []
  ) {
    const sql = prefilterSql
      ? `SELECT id, text, metadata, embedding FROM documents WHERE ${prefilterSql}`
      : `SELECT id, text, metadata, embedding FROM documents`;
    const [rows] = await this.pool.query(sql, prefilterParams);

    const candidates = rows.map((r) => {
      let emb = [];
      try {
        emb = Array.isArray(r.embedding)
          ? r.embedding
          : JSON.parse(r.embedding || "[]");
      } catch (e) {
        emb = [];
      }
      const score = cosineSimilarity(queryEmbedding, emb);
      return {
        id: r.id,
        text: r.text,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
        score,
      };
    });
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, topK);
  }
}

function dot(a, b) {
  let s = 0;
  const n = Math.min((a || []).length, (b || []).length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function norm(a) {
  return Math.sqrt(dot(a, a));
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const n = norm(a) * norm(b);
  if (n === 0) return 0;
  return dot(a, b) / n;
}
