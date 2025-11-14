// Local LLM bridge (defaults to Ollama + Gemma 2B/1B models)
// Provides text-generation helpers that the rest of the stack can call.

const http = require("http");
const https = require("https");
const { URL } = require("url");

const DEFAULT_MODEL = process.env.LOCAL_LLM_MODEL || "gemma:2b";
const DEFAULT_ENDPOINT = process.env.LOCAL_LLM_URL || "http://localhost:11434";
const MODE = process.env.MEMDISK_LLM_MODE || "ollama"; // "ollama" | "mock"

function requestJSON(path, payload) {
  const target = new URL(path, DEFAULT_ENDPOINT);
  const lib = target.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request({
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      path: `${target.pathname}${target.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    }, res => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`LLM request failed (${res.statusCode}): ${data}`));
        }
        resolve(data);
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function callOllama(prompt, options = {}) {
  const body = {
    model: options.model || DEFAULT_MODEL,
    prompt,
    stream: true,
    options: {
      temperature: options.temperature ?? 0.4,
      num_predict: options.maxTokens ?? 256,
    },
  };

  const raw = await requestJSON("/api/generate", JSON.stringify(body));
  const lines = raw.split("\n").map(line => line.trim()).filter(Boolean);
  let output = "";
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.response) {
        output += parsed.response;
      }
    } catch (_) {
      output += line;
    }
  }
  return output.trim();
}

function mockResponse(prompt) {
  const suffix = prompt.slice(-280).replace(/\s+/g, " ");
  return `[[MOCK LLM]] ${suffix}`;
}

async function generateText(prompt, options = {}) {
  if (!prompt) {
    throw new Error("Prompt is required for local LLM generation");
  }

  if (MODE === "mock") {
    return mockResponse(prompt);
  }

  return callOllama(prompt, options);
}

async function generateJSON(prompt, options = {}) {
  const completion = await generateText(prompt, options);
  const jsonMatch = completion.match(/\{[\s\S]*\}/);
  let parsed = null;
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (_) {
      parsed = null;
    }
  }
  return { raw: completion, json: parsed };
}

module.exports = { generateText, generateJSON };
