// Main API server for MemDisk
const express = require("express");
const app = express();
const PORT = 3000;
const db = require("./db");
const memdisk = require("./memdisk");
const classifier = require("./classifier");
const openrouter = require("./openrouter");
const commands = require("./commands");

// API: Load a memdisk file
app.get("/api/disk/load/:filename", async (req, res) => {
  const { filename } = req.params;
  try {
    const memoryData = await memdisk.loadDisk(filename);
    res.json(memoryData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Route query to LLM via memory context
app.post("/api/query", express.json(), async (req, res) => {
  // expects { prompt, disks[], encryptionKey }
  try {
    // Step 1: Use classifier to select relevant disks
    const routing = await classifier.routeQuery(req.body.prompt, req.body.disks || []);
    // Step 2: Assemble context and send to OpenRouter LLM
    const context = memdisk.buildContext(routing, req.body.prompt, req.body.encryptionKey);
    const result = await openrouter.sendQuery(context);
    // Step 3: Sanitize response for display
    const output = commands.sanitizeOutput(result);
    res.json({ output });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log("MemDisk API server running at http://localhost:" + PORT);
});