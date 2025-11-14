// MemDisk manager
const fs = require("fs");
const path = require("path");
const crypto = require("./crypto");

const diskFolder = path.join(__dirname, "../disk");
const MAX_MEMORY_CHARS = parseInt(process.env.MEMDISK_MEMORY_LIMIT || "12000", 10);

// Load and decrypt disk
async function loadDisk(filename, encryptionKey = null) {
  const filePath = path.join(diskFolder, filename);
  let data = await fs.promises.readFile(filePath, "utf8");
  if (encryptionKey) {
    data = crypto.decrypt(data, encryptionKey);
  }
  return JSON.parse(data);
}

async function listDisks() {
  const files = await fs.promises.readdir(diskFolder);
  return files.filter(file => file.endsWith(".dsk"));
}

function trimDiskContent(content) {
  const serialized = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  if (serialized.length <= MAX_MEMORY_CHARS) {
    return content;
  }
  const preview = serialized.slice(0, MAX_MEMORY_CHARS);
  return {
    preview,
    truncated: true,
  };
}

// Build context for OpenRouter (fit to LLM context limits)
async function buildContext(routing, prompt, encryptionKey = null, inlineDisks = []) {
  const memoryChunks = [];
  for (const disk of routing.relevantDisks) {
    const diskPayload = routing.loadedDisks?.[disk] || await loadDisk(disk, encryptionKey);
    memoryChunks.push({ disk, content: trimDiskContent(diskPayload) });
  }
  if (Array.isArray(inlineDisks) && inlineDisks.length) {
    for (const inline of inlineDisks) {
      if (!inline?.name || inline.content === undefined) continue;
      memoryChunks.push({ disk: inline.name, content: trimDiskContent(inline.content) });
    }
  }
  return { prompt, memory: memoryChunks, routingMeta: routing };
}

module.exports = { loadDisk, buildContext, listDisks };