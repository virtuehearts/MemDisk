// MemDisk manager
const fs = require("fs");
const path = require("path");
const crypto = require("./crypto");

const diskFolder = path.join(__dirname, "../disk");

// Load and decrypt disk
async function loadDisk(filename, encryptionKey = null) {
  const filePath = path.join(diskFolder, filename);
  let data = fs.readFileSync(filePath, "utf8");
  // Decrypt if key provided
  if (encryptionKey) {
    data = crypto.decrypt(data, encryptionKey);
  }
  return JSON.parse(data);
}

// Build context for OpenRouter (fit to LLM context limits)
function buildContext(routing, prompt, encryptionKey = null) {
  // Assemble relevant disk data w/ size limits
  let memoryChunks = [];
  for (const disk of routing.relevantDisks) {
    const contents = loadDisk(disk, encryptionKey);
    memoryChunks.push(contents);
    // TODO: enforce context size limits
  }
  return { prompt, memory: memoryChunks, routingMeta: routing };
}

module.exports = { loadDisk, buildContext };