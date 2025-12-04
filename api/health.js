export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true, now: new Date().toISOString() });
}
export default function handler(req, res) {
  res.status(200).send("RAG Chatbot running on Vercel!");
}
