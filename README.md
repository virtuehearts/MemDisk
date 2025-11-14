# MemDisk 0.1B

**MemDisk: A Peer-to-Peer Distributed Memory System for Large Language Models**

## Abstract

Large language models lack persistent memory, treating each query as an isolated event. MemDisk solves this fundamental limitation: a local memory protocol that lets LLMs maintain curated, persistent, and user-controlled context across sessions—without reliance on centralized services or infinite context windows.

## Project Structure

- `src/`: Node.js backend
- `disk/`: Local "memdisk" files (JSON, optionally encrypted)
- `frontend/`: Terminal-style AI-OS web frontend

## Main Components

- **Node.js Backend**: Handles memory management, encryption, SQLite storage, and API routing.
- **Gemma (Classifier Monk)**: Local LLM, limited to 32k tokens, routes queries to select relevant MemDisk memory.
- **OpenRouter API**: Sends user prompt + curated memory context to a large external LLM (supports 128k context).
- **Web Terminal**: MSDOS-like AI-OS for interactive sessions, loading memory disks, executing commands.

## How It Works

1. User interacts in terminal front-end.  
2. Commands (e.g. `load dark_poetry.dsk`) select local memory files.  
3. Gemma routes/retrieves relevant memory chunks.  
4. Main LLM (via OpenRouter) receives full context (prompt + memory) for processing.
5. Sanitized output displayed to user (memories and ops context stripped).

## Features

- Finite local memory units (1.44MB each, as `.dsk` JSON files)
- SHA256 + Bitcoin-style keypair crypto
- SQLite for storage, audit trail, versioning
- Classifier Monk as local router (Gemma LLM)
- Context injection protocol
- Optional disk encryption
- Modular terminal web frontend

## Getting Started

1. Install packages: `npm install`
2. Start backend server: `npm run start`
3. Open `frontend/index.html` in your browser.

## License

MIT

## Contact

Virtuehearts, darknet.ca labs, admin@darknet.ca

```

```json name=package.json
{
  "name": "memdisk",
  "version": "0.1.0",
  "description": "MemDisk: A Peer-to-Peer Distributed Memory System for Large Language Models.",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  },
  "author": "virtuehearts",
  "license": "MIT",
  "dependencies": {
    "express": "^4.19.0",
    "sqlite3": "^5.1.6",
    "crypto": "^1.0.1"
  }
}
```

```javascript name=src/server.js
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
```

```javascript name=src/db.js
// SQLite manager for MemDisk
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./memdisk.db");

// Initial schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS disks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE,
      data BLOB,
      hash TEXT,
      version INTEGER,
      timestamp TEXT,
      publicKey TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disk_id INTEGER,
      operation TEXT,
      user TEXT,
      timestamp TEXT,
      previous_hash TEXT,
      FOREIGN KEY (disk_id) REFERENCES disks(id)
    )
  `);
});

module.exports = db;
```

```javascript name=src/memdisk.js
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
```

```javascript name=src/classifier.js
// Classifier Monk interface (Gemma LLM stub)
// For now, simulate classification (real Gemma integration required)
module.exports = {
  async routeQuery(prompt, disks) {
    // In real use: call Gemma LLM w/ tools/memory set to select relevant disks
    // For now, select all disks containing prompt keyword (mock)
    const relevantDisks = disks.filter(disk => disk.toLowerCase().includes(prompt.toLowerCase()));
    return { relevantDisks, analysis: "Stub classifier result" };
  }
};
```

```javascript name=src/openrouter.js
// OpenRouter LLM API wrapper (stub)
module.exports = {
  async sendQuery(context) {
    // TODO: integrate with OpenRouter API
    // Simulate LLM output for now
    return `LLM Output for prompt: "${context.prompt}" with memory: ${context.memory.length} chunks loaded`;
  }
};
```

```javascript name=src/crypto.js
// Crypto routines for MemDisk
const cryptoLib = require("crypto");

// SHA256 hash
function sha256(data) {
  return cryptoLib.createHash("sha256").update(data).digest("hex");
}

// Generate Bitcoin-style public/private keypair (ECDSA)
function generateKeypair() {
  const { generateKeyPairSync } = require("crypto");
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

// Encryption & decryption (AES-256 demo)
function encrypt(data, key) {
  const cipher = cryptoLib.createCipher("aes-256-cbc", key);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(data, key) {
  const decipher = cryptoLib.createDecipher("aes-256-cbc", key);
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { sha256, generateKeypair, encrypt, decrypt };
```

```javascript name=src/commands.js
// CLI command handling and output sanitization

// Parse/sanitize LLM response before displaying in terminal
function sanitizeOutput(text) {
  // Strip operational meta/context blocks (e.g., "[MEMORY]" or "[INJECTED]")
  return text.replace(/\[MEMORY:.*?\]/gs, "").replace(/\[OPERATION:.*?\]/gs, "").trim();
}

module.exports = { sanitizeOutput };
```

```html name=frontend/index.html
<!DOCTYPE html>
<html>
<head>
  <title>MemDisk AI-OS Terminal</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="terminal">
    <div id="output"></div>
    <input type="text" id="input" autofocus placeholder="Type a command...">
  </div>
  <script src="terminal.js"></script>
</body>
</html>
```

```javascript name=frontend/terminal.js
// AI-OS Terminal Emulator Frontend

document.getElementById("input").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const cmd = e.target.value;
    if (!cmd) return;
    document.getElementById("output").innerHTML += `<div>> ${cmd}</div>`;
    e.target.value = "";

    // Demo command: load disk
    if (cmd.startsWith("load ")) {
      const diskName = cmd.split(" ")[1];
      const res = await fetch(`/api/disk/load/${diskName}`);
      const diskData = await res.json();
      document.getElementById("output").innerHTML += `<pre>[DISK LOADED]\n${JSON.stringify(diskData, null, 2)}</pre>`;
    }
    // Demo command: ask LLM
    else if (cmd.startsWith("ask ")) {
      const prompt = cmd.slice(4);
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, disks: ["example.dsk"] }),
      });
      const { output } = await res.json();
      document.getElementById("output").innerHTML += `<pre>${output}</pre>`;
    }
    // Help
    else if (cmd === "help") {
      document.getElementById("output").innerHTML += `<pre>Commands:\n- load [diskname.dsk]\n- ask [prompt]\n- help</pre>`;
    }
    else {
      document.getElementById("output").innerHTML += `<pre>Error: Unknown command\nType 'help' for list of commands.</pre>`;
    }
  }
});
```

```css name=frontend/style.css
body { background: #222; color: #fff; font-family: "Courier New", monospace; }
#terminal { width: 600px; margin: 40px auto; background: #111; padding: 20px; border-radius: 8px; }
#output { min-height: 300px; padding-bottom: 10px; }
#input { width: 100%; padding: 8px; background: #222; color: #fff; border: none; font-size: 1em; }
pre { background: #1a1a1a; color: #bada55; padding: 6px; border-radius: 4px; margin: 8px 0; }
```

```json name=disk/example.dsk
{
  "persona": "Dark Poetry",
  "skills": ["Metaphor generation", "Surreal description", "Creative writing"],
  "knowledge": {
    "quotes": [
      "The stars blinked with ancient warnings.",
      "Memory is a locked room, echoing with ghosts.",
      "Rewrite the world between shadows and truth."
    ],
    "themes": ["melancholy", "rebirth", "night", "memory"]
  },
  "created": "2025-11-14T14:48:55Z",
  "version": 1,
  "hash": "dummydiskhash"
}
```

```gitignore name=.gitignore
node_modules
memdisk.db
disk/*.dsk
.env
```
