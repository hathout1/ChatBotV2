RAG Chatbot (Node.js)

Quick start

1. Copy `.env.example` to `.env` and fill `OPENAI_API_KEY`.
2. Install:

```powershell
cd d:/GM/ChatBot
npm install
```

3. Run:

```powershell
npm start
```

Endpoints

- POST `/ingest` — add a document. JSON body: `{ "id": "doc1", "text": "Document text", "metadata": {"source":"file1"} }`
- POST `/chat` — ask a question. JSON body: `{ "query": "What is ..." }`

This project uses OpenAI embeddings to store vectors in a simple in-memory vector store and then builds a context (top-K similar docs) to pass to the chat model for a RAG answer.

Application state and flow

- **Startup**: `src/index.js` loads environment variables, initializes the OpenAI client, and creates an in-memory vector store.
- **Express app**: an Express server is created, CORS and JSON body parsing are enabled, and static files are served from the `public` folder.
- **Health check**: `GET /health` responds with a simple string to confirm the server is running.
- **Document ingestion state**: when you call `POST /ingest`, the document text is embedded and stored in the in-memory vector store. This state lives only in RAM and is lost if the server restarts.
- **Chat flow**: when you call `POST /chat`, the server:
  - takes the `query` (and optional `context`),
  - retrieves the most relevant documents from the vector store,
  - builds a prompt with the retrieved context,
  - calls the OpenAI chat model and returns the generated answer.
- **Frontend interaction**: any frontend (for example, an Angular app) can send HTTP `POST` requests to `/chat` with a JSON body that includes a `query` field.
- **Configuration**: the server listens on `PORT` from `.env` (defaults to `3000`) and uses model and embedding names also configured via environment variables.

Notes

- This is an example starter; for production use replace the in-memory store with a persistent/vector DB (Pinecone, Weaviate, Milvus, pgvector, etc.), add authentication, rate-limiting, and safety checks.
