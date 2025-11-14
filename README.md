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
- **Gemma 1B (Memory Monk)**: Local LLM routed through Ollama that writes, rewrites, downloads, and curates memdisks so they're searchable (dark poetry, Punjabi ghazals, etc.).
- **OpenRouter Models**: Cloud LLMs that take the curated memories and generate the final response for the user.
- **Web Terminal**: MSDOS-like AI-OS for interactive sessions, loading memory disks, executing commands.

## How It Works

1. User interacts in terminal front-end.
2. Commands (e.g. `load dark_poetry.dsk`) select local memory files.
3. The Gemma 1B Memory Monk (running locally) reviews every floppy and chooses what matters.
4. The curated context is streamed to OpenRouter, which performs the heavy reasoning and response generation.
5. Sanitized output displayed to user (memories and ops context stripped).

## Features

- Finite local memory units (1.44MB each, as `.dsk` JSON files)
- SHA256 + Bitcoin-style keypair crypto
- SQLite for storage, audit trail, versioning
- Classifier Monk powered by local Gemma 1B while the Oracle lives on OpenRouter
- Context injection protocol that trims floppy JSON to fit LLM limits
- Optional disk encryption
- Modular terminal web frontend with routing telemetry
- Curated memdisks for any vibe (dark poetry, Punjabi poetry, etc.) that can be shared and remixed

## LLM Roles

- **Local (Gemma 1B via Ollama):** Handles all memory management—generating new memdisks, rewriting or downloading content into them, tagging/indexing, and ranking disks for a query.
- **Remote (OpenRouter):** Receives only the pruned memories + user prompt and produces the final conversational answer.

## Getting Started

### 1. Prepare a local Gemma 1B runner (memory-only)

Install [Ollama](https://ollama.com/) (macOS, Linux, or Windows WSL) and start the daemon. Pull the smaller Gemma 1B/2B variant that can comfortably live on your laptop—this runner never leaves your machine and is used strictly for memory ops (disk writing, rewriting, downloading, routing).

```bash
ollama pull gemma:2b   # gemma:1.1b or 2b both work for memory; pick what fits your hardware
ollama serve
```

MemDisk will call `http://localhost:11434/api/generate` by default. Use these environment variables to customize the local LLM connection:

| Variable | Description | Default |
| --- | --- | --- |
| `LOCAL_LLM_MODEL` | Ollama model slug (e.g., `gemma:2b`, `gemma:2b-instruct`) | `gemma:2b` |
| `LOCAL_LLM_URL` | Base URL for the Ollama HTTP API | `http://localhost:11434` |
| `MEMDISK_LLM_MODE` | `ollama` for real inference, `mock` for a deterministic stub | `ollama` |
| `MEMDISK_LLM_MAX_TOKENS` | Max response tokens for the answer step | `256` |

> **No GPU?** Set `MEMDISK_LLM_MODE=mock` to exercise the whole pipeline with a built-in placeholder response until you connect to a real model.

### 2. Configure OpenRouter (remote processing)

OpenRouter handles the actual dialog/analysis. Grab an API key from [https://openrouter.ai/](https://openrouter.ai/) and export it before starting the server:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export OPENROUTER_MODEL="openrouter/auto"    # or any model you prefer
export OPENROUTER_APP_NAME="MemDisk"
```

| Variable | Description | Default |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Required API key for OpenRouter | _none_ |
| `OPENROUTER_MODEL` | Model slug to hit via OpenRouter | `openrouter/auto` |
| `OPENROUTER_API_URL` | Override endpoint URL | `https://openrouter.ai/api/v1/chat/completions` |
| `OPENROUTER_MAX_TOKENS` | Cap on output tokens returned | `512` |
| `OPENROUTER_TEMPERATURE` | Sampling temperature for responses | `0.7` |
| `OPENROUTER_APP_NAME` | Name reported to OpenRouter | `MemDisk` |
| `OPENROUTER_SITE_URL` | Referer header (use your deploy URL) | `https://github.com/virtuehearts/memdisk` |

### 3. Install Node dependencies

```bash
npm install
```

### 4. Start the MemDisk backend

```bash
npm run start
```

This launches the Express API on `http://localhost:3000`.

### 5. Launch the AI-OS terminal

Open `frontend/index.html` in your browser (or serve the `frontend/` folder with any static HTTP server). The UI will communicate with the backend through the same origin.

## Terminal Commands

The AI-OS web terminal uses slash commands that mirror the `frontend/terminal.js` command deck. The most common ones are:

| Command | Description |
| --- | --- |
| `/disks list` | List every `.dsk` file discovered under `/disk`. |
| `/disks load <name>` | Mount a floppy from the backend so Gemma can inspect it. |
| `/disks load` (raw) | Enter interactive mode to paste inline JSON/text that becomes a temporary disk. Finish by pasting the content; `/cancel` aborts. |
| `/disks download <name>` | Request a gzipped copy of a mounted disk from the server. |
| `/status` | Show backend health (LLM mode, database state, etc.). |
| `/model list` / `/model <id>` | Inspect OpenRouter model options or set the active upstream model. |
| `/ask <prompt>` | Send your question plus the mounted disks to Gemma for routing and OpenRouter for the final answer. |
| `/clear` | Reset the visible terminal output. |
| `/help` or `/menu` | Reprint the command deck banner. |

Each `/ask` call shows the sanitized OpenRouter response plus an expandable "Routing" block that reveals which disks Gemma selected, why they were chosen, and the raw classifier output. Inline disks you compose through the raw loader are tagged as `[inline]` so you know which memories came from the current session.

## Default Persona & Chat UX

Maya is the default AI-OS persona (MemDisk ver 0.1b). She behaves like a regular chatbot—type normal sentences and the terminal automatically routes them through `/ask`. The banner prints a **system directive** describing how to mount disks, personalize the experience, and even rename Maya. That directive (along with her greeting and metadata) now lives in [`disk/maya.dsk`](disk/maya.dsk), and the terminal auto-mounts it on boot so Maya's baseline memory is always active. Use it as the template for crafting new `.dsk` personas. Load a custom disk with `/disks load <persona.dsk>` (or the raw loader) and Maya will immediately adopt the new voice while still supporting the command deck.

## License

MIT /  Apache 2.0 

## Contact

Virtuehearts, darknet.ca labs, admin@darknet.ca

---

**Instagram:** @virtuehearts  
**X:** Virtue_hearts  
**Email:** admin@darknet.ca  
**Webpage:** [https://darknet.ca](https://darknet.ca)  
**Location:** Toronto, Canada  
**Donations:** Bitcoin:  `bc1qzs4wc5thvzj607njf7h69gxkmwfuwswj3ujq6m`  
darknet.ca powered by AlmaLinux 8 64-Bit | Lowendbox VPS
