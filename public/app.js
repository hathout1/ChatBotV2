const el = (id) => document.getElementById(id);
const logs = el("logs");

function log(...args) {
  logs.textContent +=
    args
      .map((a) =>
        typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
      )
      .join(" ") + "\n";
  logs.scrollTop = logs.scrollHeight;
}

async function postJson(path, body) {
  log("POST", path, body);
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok) log("Error", j);
  return j;
}

async function askBot() {
  const q = el("query").value.trim();
  if (!q) {
    alert("Type a question");
    return;
  }

  el("chat-result").textContent = "Thinking...";
  const r = await postJson("/chat", { query: q }); // مفيش context دلوقتي
  el("chat-result").textContent = r.answer || JSON.stringify(r, null, 2);
  log("You:", q);
  log("Bot:", r.answer || "No answer");
  el("query").value = "";
}

// زرار send
el("send-btn").addEventListener("click", askBot);

// ضغط Enter داخل الـ textarea
el("query").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    askBot();
  }
});

log("UI ready");
