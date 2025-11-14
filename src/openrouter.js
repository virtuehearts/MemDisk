// OpenRouter orchestrator for main reasoning + response generation
const OPENROUTER_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/auto";
const MAX_TOKENS = parseInt(process.env.OPENROUTER_MAX_TOKENS || "512", 10);
const TEMPERATURE = parseFloat(process.env.OPENROUTER_TEMPERATURE || "0.7");

function serializeMemory(memory) {
  if (!memory?.length) {
    return "(No memdisks were mounted for this query)";
  }
  return memory
    .map((chunk, idx) => {
      const rendered = typeof chunk.content === "string"
        ? chunk.content
        : JSON.stringify(chunk.content, null, 2);
      return `Disk ${idx + 1}: ${chunk.disk}\n${rendered}`;
    })
    .join("\n\n");
}

function buildMessages(context) {
  const system = {
    role: "system",
    content:
      "You are Jero, the MemDisk AI. A local Gemma monk already curated the disks you receive. Use them as memory, cite disk names when relevant, and focus on actionable answers.",
  };

  const memoryBlock = serializeMemory(context.memory);
  const user = {
    role: "user",
    content: `User Prompt:\n${context.prompt}\n\nMounted MemDisks:\n${memoryBlock}`,
  };

  return [system, user];
}

async function callOpenRouter(messages) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Set it to call the OpenRouter API.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://github.com/virtuehearts/memdisk",
    "X-Title": process.env.OPENROUTER_APP_NAME || "MemDisk",
  };

  const body = {
    model: OPENROUTER_MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter request failed (${res.status}): ${errText}`);
  }

  const payload = await res.json();
  const message = payload.choices?.[0]?.message?.content;
  if (!message) {
    throw new Error("OpenRouter response did not include any content");
  }
  return message.trim();
}

module.exports = {
  async sendQuery(context) {
    const messages = buildMessages(context);
    return callOpenRouter(messages);
  },
};