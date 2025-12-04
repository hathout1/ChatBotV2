import dotenv from "dotenv";
dotenv.config();

import handler from "../api/chat.js";

function makeReq(body) {
  return {
    method: "POST",
    headers: {},
    body,
  };
}

function makeRes() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      console.log("RES JSON:", JSON.stringify(obj, null, 2));
      return this;
    },
    send(s) {
      console.log("RES SEND:", s);
      return this;
    },
    end() {
      console.log("RES END");
      return this;
    },
  };
}

async function run() {
  console.log("Starting local handler test...");
  const req = makeReq({ query: "where is the first offer" });
  const res = makeRes();
  try {
    await handler(req, res);
    console.log("Handler returned without throwing.");
  } catch (err) {
    console.error("Handler threw:", err);
  }
}

run();
