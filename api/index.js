function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    setCors(res);
    return res.status(204).end();
  }
  setCors(res);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>RAG Chatbot API</title></head>
<body>
  <h1>RAG Chatbot API</h1>
  <p>Endpoints:</p>
  <ul>
    <li><a href="/chat">/chat</a> - POST JSON { query, context? }</li>
    <li><a href="/ingest">/ingest</a> - POST JSON { id, text, metadata? }</li>
    <li><a href="/health">/health</a> - health check</li>
  </ul>
  <p>Use these endpoints from your Angular app (set Authorization header if enabled).</p>
</body></html>`);
}
