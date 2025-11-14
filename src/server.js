// Main API server for MemDisk
const express = require("express");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const app = express();
const PORT = 3000;
const db = require("./db");
const memdisk = require("./memdisk");
const classifier = require("./classifier");
const openrouter = require("./openrouter");
const commands = require("./commands");

const diskFolder = path.join(__dirname, "../disk");

app.use(express.json({ limit: "1mb" }));

function getGemmaStatus() {
  if (process.env.MEMDISK_LLM_MODE === "mock") {
    return "mock";
  }
  return process.env.LOCAL_LLM_URL ? "ok" : "offline";
}

// API: list disks
app.get("/api/disks", async (_req, res) => {
  try {
    const disks = await memdisk.listDisks();
    res.json({ disks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/status", async (_req, res) => {
  try {
    const disks = await memdisk.listDisks();
    res.json({
      gemma: getGemmaStatus(),
      openrouter: process.env.OPENROUTER_API_KEY ? "ok" : "missing_api_key",
      model: openrouter.getModel(),
      availableDisks: disks,
    });
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

app.get("/api/disk/download/:filename", async (req, res) => {
  const { filename } = req.params;
  if (!filename.endsWith(".dsk")) {
    return res.status(400).json({ error: "Only .dsk files can be downloaded" });
  }
  try {
    const safeName = path.basename(filename);
    const filePath = path.join(diskFolder, safeName);
    const data = await fs.promises.readFile(filePath);
    zlib.gzip(data, (err, compressed) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.setHeader("Content-Type", "application/gzip");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.gz"`);
      res.send(compressed);
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/model", (_req, res) => {
  res.json({ model: openrouter.getModel() });
});

app.post("/api/model", async (req, res) => {
  try {
    const model = req.body.model?.trim();
    if (!model) {
      return res.status(400).json({ error: "Model is required" });
    }
    openrouter.setModel(model);
    res.json({ model: openrouter.getModel() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/models/free", async (_req, res) => {
  try {
    const endpoint = "https://openrouter.ai/api/v1/models?max_price=0";
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Unable to fetch models (${response.status})`);
    }
    const payload = await response.json();
    const models = payload.data?.map(model => ({
      id: model.id,
      pricing: model.pricing,
    })) || [];
    res.json({ models });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Route query to LLM via memory context
app.post("/api/query", async (req, res) => {
  // expects { prompt, disks[], encryptionKey, inlineDisks[] }
  try {
    const inlineDisks = Array.isArray(req.body.inlineDisks) ? req.body.inlineDisks : [];
    const disksToConsider = req.body.disks?.length ? req.body.disks : await memdisk.listDisks();
    const routing = await classifier.routeQuery(req.body.prompt, disksToConsider, req.body.encryptionKey);
    routing.inlineDisks = inlineDisks.map(disk => disk.name).filter(Boolean);
    const context = await memdisk.buildContext(routing, req.body.prompt, req.body.encryptionKey, inlineDisks);
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