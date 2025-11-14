// Main API server for MemDisk
const express = require("express");
const app = express();
const PORT = 3000;
const db = require("./db");
const memdisk = require("./memdisk");
const classifier = require("./classifier");
const openrouter = require("./openrouter");
const commands = require("./commands");

// API: list disks
app.get("/api/disks", async (_req, res) => {
  try {
    const disks = await memdisk.listDisks();
    res.json({ disks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Load a memdisk file
app.get("/api/disk/load/:filename", async (req, res) => {
  const { filename } = req.params;
  const encryptionKey = req.query.key || null;
  try {
    const memoryData = await memdisk.loadDisk(filename, encryptionKey);
    res.json(memoryData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Route query to LLM via memory context
app.post("/api/query", express.json(), async (req, res) => {
  // expects { prompt, disks[], encryptionKey }
  try {
    const disksToConsider = req.body.disks?.length ? req.body.disks : await memdisk.listDisks();
    const routing = await classifier.routeQuery(req.body.prompt, disksToConsider, req.body.encryptionKey);
    const context = await memdisk.buildContext(routing, req.body.prompt, req.body.encryptionKey);
    const result = await openrouter.sendQuery(context);
    // Step 3: Sanitize response for display
    const output = commands.sanitizeOutput(result);
    res.json({ output, routing });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log("MemDisk API server running at http://localhost:" + PORT);
});