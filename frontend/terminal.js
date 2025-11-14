// AI-OS Terminal Emulator Frontend with Codex-style command deck

const terminalTitle = "Maya AI-OS // MemDisk ver 0.1b";
const mayaDirective = `SYSTEM DIRECTIVE — Maya (MemDisk ver 0.1b)
Maya is your resident AI-OS. She remembers you by curating .dsk ("diskette") files that Gemma can rewrite, tag, and route.

Talk first, command second:
• Type plain sentences to chat with Maya. They're routed through /ask automatically.
• Use commands (prefixed with /) whenever you want fine control.

Core MemDisk workflow:
1. /disks list — discover local memories.
2. /disks load <name.dsk> — mount a persona/memory. Use /disks load with no name to paste raw JSON for ad‑hoc memories.
3. /ask <prompt> — talk to Maya with the mounted memories in context.
4. /status — confirm which disks are active and which models are live.

Personalization + renaming Maya:
• Create or edit a .dsk to describe a new personality, tone, or knowledge cache.
• Tell Gemma what to rewrite via /ask (e.g., "rewrite maya_persona.dsk with a calmer voice").
• Load multiple disks to mix vibes. The first persona disk usually steers Maya's name—change it anytime.

Need a template? See default.md for Maya's baseline persona and copy it into a new .dsk when crafting custom memories.`;
const mayaGreeting = "Maya online. I can chat like a standard assistant while keeping curated memories on local disks. Ask me anything or use /help for the command deck.";
const mainMenu = [
  "/disks list",
  "/disks load <diskname.dsk>",
  "/disks load (raw interactive)",
  "/disks download <diskname.dsk>",
  "/status",
  "/model list | /model <id>",
  "/ask <prompt>",
  "/clear",
  "/help or /menu",
];

const state = {
  loadedDisks: [], // { name, source: "remote" | "inline" }
  inlineDisks: [], // { name, content }
  rawDiskCapture: null, // { stage: "name" | "data", name }
};

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appendOutput(html) {
  const output = document.getElementById("output");
  output.insertAdjacentHTML("beforeend", html);
  output.scrollTop = output.scrollHeight;
}

function echoInput(value) {
  if (!value?.trim() && !state.rawDiskCapture) {
    return;
  }
  appendOutput(`<div class="echo">&gt; ${escapeHtml(value)}</div>`);
}

function showBanner() {
  appendOutput(`<pre class="banner">${terminalTitle}</pre>`);
  showMenu();
  showDirective();
  showGreeting();
}

function showMenu() {
  const list = mainMenu.map(item => `- ${item}`).join("\n");
  appendOutput(`<pre>Command Deck:\n${list}</pre>`);
}

function showDirective() {
  appendOutput(`<pre class="system">${escapeHtml(mayaDirective)}</pre>`);
}

function showGreeting() {
  appendOutput(`<pre class="assistant">${escapeHtml(mayaGreeting)}</pre>`);
}

async function listDisks() {
  const res = await fetch("/api/disks");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Unable to list disks");
  }
  return data;
}

async function loadDiskFromServer(name) {
  const encoded = encodeURIComponent(name);
  const res = await fetch(`/api/disk/load/${encoded}`);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || "Unable to load disk");
  }
  addLoadedDisk(name, "remote");
  appendOutput(`<pre>[REMOTE DISK MOUNTED]\n${escapeHtml(name)} is ready.</pre>`);
  return payload;
}

function addLoadedDisk(name, source = "remote") {
  if (!name) return;
  const existing = state.loadedDisks.find(disk => disk.name === name);
  if (existing) {
    existing.source = source;
    return;
  }
  state.loadedDisks.push({ name, source });
}

function getRemoteDiskNames() {
  return state.loadedDisks.filter(disk => disk.source === "remote").map(disk => disk.name);
}

function summarizeLoadedDisks() {
  if (!state.loadedDisks.length) return "(no disks mounted)";
  return state.loadedDisks.map(disk => `${disk.name} [${disk.source}]`).join("\n");
}

function beginRawDiskCapture() {
  state.rawDiskCapture = { stage: "name", name: null };
  appendOutput(`<pre>RAW LOAD MODE ENABLED\nEnter a filename for your .dsk (example: memories.dsk) then press Enter.\nType /cancel to abort.</pre>`);
}

function finishRawCapture(name, content) {
  state.inlineDisks = state.inlineDisks.filter(d => d.name !== name);
  state.inlineDisks.push({ name, content });
  addLoadedDisk(name, "inline");
  appendOutput(`<pre>[INLINE DISK LOADED]\n${escapeHtml(name)} mounted from raw input.</pre>`);
  state.rawDiskCapture = null;
}

function handleRawDiskInput(inputValue) {
  if (!state.rawDiskCapture) return false;
  const trimmed = inputValue.trim();
  if (trimmed === "/cancel") {
    appendOutput(`<pre class="error">Raw disk load cancelled.</pre>`);
    state.rawDiskCapture = null;
    return true;
  }
  if (state.rawDiskCapture.stage === "name") {
    if (!trimmed) {
      appendOutput(`<pre class="error">Please provide a disk filename.</pre>`);
      return true;
    }
    state.rawDiskCapture.name = trimmed.endsWith(".dsk") ? trimmed : `${trimmed}.dsk`;
    state.rawDiskCapture.stage = "data";
    appendOutput(`<pre>Paste the raw JSON or text for ${escapeHtml(state.rawDiskCapture.name)} then press Enter.\n(Type /cancel to abort.)</pre>`);
    return true;
  }
  try {
    const parsed = JSON.parse(inputValue);
    finishRawCapture(state.rawDiskCapture.name, parsed);
  } catch (_) {
    finishRawCapture(state.rawDiskCapture.name, inputValue);
  }
  return true;
}

async function downloadDisk(name) {
  const encoded = encodeURIComponent(name);
  const res = await fetch(`/api/disk/download/${encoded}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.gz`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  appendOutput(`<pre class="download-hint">Download prepared for ${escapeHtml(name)} (gzipped).</pre>`);
}

async function fetchStatus() {
  const res = await fetch("/api/status");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch status");
  }
  return data;
}

async function fetchModelList() {
  const res = await fetch("/api/models/free");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch models");
  }
  return data;
}

async function getActiveModel() {
  const res = await fetch("/api/model");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch model");
  }
  return data;
}

async function setActiveModel(model) {
  const res = await fetch("/api/model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Unable to set model");
  }
  return data;
}

async function askLLM(prompt) {
  const remoteDisks = getRemoteDiskNames();
  const payload = {
    prompt,
    disks: remoteDisks,
    inlineDisks: state.inlineDisks,
  };
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Query failed");
  }
  appendOutput(`<pre>${escapeHtml(data.output)}</pre>`);
  if (data.routing) {
    appendOutput(`<details><summary>Routing</summary><pre>${escapeHtml(JSON.stringify(data.routing, null, 2))}</pre></details>`);
  }
}

async function handleDisksCommand(args) {
  const subCommand = args.shift() || "list";
  switch (subCommand) {
    case "list": {
      const data = await listDisks();
      appendOutput(`<pre>Available disks:\n${escapeHtml((data.disks || []).join("\n") || "(none)")}</pre>`);
      break;
    }
    case "load": {
      const diskName = args.shift();
      if (!diskName) {
        beginRawDiskCapture();
        break;
      }
      await loadDiskFromServer(diskName);
      break;
    }
    case "download": {
      const diskName = args.shift();
      if (!diskName) {
        throw new Error("Specify a disk to download");
      }
      await downloadDisk(diskName);
      break;
    }
    default:
      throw new Error("Unknown /disks command");
  }
}

async function handleModelCommand(args) {
  const sub = args[0];
  if (!sub) {
    const data = await getActiveModel();
    appendOutput(`<pre>Active OpenRouter model: ${escapeHtml(data.model)}</pre>`);
    return;
  }
  if (sub === "list") {
    const data = await fetchModelList();
    const models = (data.models || []).map(model => `${model.id} (${JSON.stringify(model.pricing || {})})`).join("\n") || "No free models detected.";
    appendOutput(`<pre>Free OpenRouter models:\n${escapeHtml(models)}</pre>`);
    return;
  }
  const response = await setActiveModel(sub);
  appendOutput(`<pre>Model override applied: ${escapeHtml(response.model)}</pre>`);
}

async function routeCommand(inputValue) {
  if (handleRawDiskInput(inputValue)) {
    return;
  }
  const trimmed = inputValue.trim();
  if (!trimmed) return;
  if (!trimmed.startsWith("/")) {
    await askLLM(trimmed);
    return;
  }
  const args = trimmed.split(/\s+/);
  const command = args.shift();
  const payload = args;

  switch (command) {
    case "/help":
    case "/menu":
      showMenu();
      break;
    case "/clear":
      document.getElementById("output").innerHTML = "";
      showBanner();
      break;
    case "/disks":
      await handleDisksCommand(payload);
      break;
    case "/status": {
      const status = await fetchStatus();
      const body = [
        `Gemma (local LLM): ${status.gemma}`,
        `OpenRouter: ${status.openrouter}`,
        `Active model: ${status.model}`,
        `Mounted disks:\n${summarizeLoadedDisks()}`,
      ].join("\n");
      appendOutput(`<pre>${escapeHtml(body)}</pre>`);
      break;
    }
    case "/model":
      await handleModelCommand(payload);
      break;
    case "/ask": {
      const prompt = trimmed.slice("/ask".length).trim();
      if (!prompt) {
        throw new Error("Provide a prompt after /ask");
      }
      await askLLM(prompt);
      break;
    }
    default:
      appendOutput(`<pre class="error">Unknown command. Use /help for guidance.</pre>`);
  }
}

function setupInput() {
  const input = document.getElementById("input");
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const value = input.value;
      input.value = "";
      echoInput(value);
      try {
        await routeCommand(value);
      } catch (err) {
        appendOutput(`<pre class="error">${escapeHtml(err.message)}</pre>`);
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  showBanner();
  setupInput();
});
