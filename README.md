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

## Roadmap: Making It Truly P2P

MemDisk 0.1B still ships as a "local-first but centrally shared" prototype. The true peer-to-peer layer is on deck:

- **Transport options:** Torrents/IPFS bundles for `.dsk` packs plus signed magnet files that describe their provenance.
- **Git-style syncing:** Each `.dsk` keeps a hash chain. Upcoming `memdisk sync` will let two peers fast-forward changes over SSH or any git remote.
- **Discovery:** A gossip table per node advertises curated disks (topic tags, signatures, file hashes). Nodes can follow curators they trust.
- **Sharing etiquette:** Every `.dsk` contains routing hints + licensing so receivers know how to mount/remix. Expect a CLI helper that packages/announces curated disks automatically.

Until those pieces land, everything stays on your machine—share `.dsk` files manually (email, git, USB) so no one expects a built-in swarm.

## LLM Roles

- **Local (Gemma 1B via Ollama):** Handles all memory management—generating new memdisks, rewriting or downloading content into them, tagging/indexing, and ranking disks for a query.
- **Remote (OpenRouter):** Receives only the pruned memories + user prompt and produces the final conversational answer.

## Getting Started

### 0. Copy the environment template (.env + dotenv)

`cp .env.example .env` and edit anything you need. The backend auto-loads the file via a lightweight dotenv loader (`src/env.js`), so `npm run start` just works with whatever variables you set.

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

### 5. Launch everything with one command

```bash
npm run dev
```

The script runs the backend on port 3000 and serves `frontend/` on `http://localhost:4173`, so you can click once and use `/disks` immediately.

### 6. Launch the AI-OS terminal (manual option)

Prefer manual control? Open `frontend/index.html` in your browser (or serve the folder with any static HTTP server). The UI will communicate with the backend through the same origin.

> **Quick mock demo:** No GPU? Clone the repo, copy `.env.example`, then run `MEMDISK_LLM_MODE=mock npm run dev`. You'll get deterministic placeholder answers while still exercising routing + disk loading.

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

## Example Session: Dark Poetry Disk

`disk/dark_poetry.dsk` ships with Punjabi ghazal scaffolds so you can see a full end-to-end run:

```
/disks list
> maya.dsk
> dark_poetry.dsk
> virtueism_mirror.dsk

/disks load dark_poetry.dsk
> Mounted dark_poetry.dsk — Nocturnal ghazal codex curated by virtuehearts.

/ask write me a new ghazal about lost cities
> Rain rehearsed encrypted vows. (OpenRouter response trimmed.)
```

Routing output for that `/ask` shows how MemDisk differs from "just throw notes into context":

```
Routing — Gemma 1B Memory Monk
Selected disks:
- dark_poetry.dsk (score 0.92)
  Reason: prompt mentions "ghazal" + "lost cities"; disk marked "South Asian gothic".

Chunks passed upstream:
1. ghazal_templates[0] — "Ghost Platforms" template for lost city imagery.
2. fragments.surge-01 — river + ruins metaphor to anchor stanza two.
```

Only those classifier-picked slices go to OpenRouter, so you can inspect exactly why each line shows up in the final poem.

## Safety & Privacy Model

- **Stays local:** Entire `.dsk` files, encryption keys, SQLite history, and raw terminal transcripts never leave your machine.
- **Can leave (opt-in):** Only the classifier-selected excerpts + your current prompt are sent to OpenRouter (or whichever remote endpoint you configure).
- **Gemma's role:** Local Gemma 1B/2B handles curation, tagging, compression, and routing. It is the only model that reads full disks.
- **Remote role:** OpenRouter (or any API-compatible endpoint) receives the curated payload and produces the final answer.
- **Air-gapped option:** Point `OPENROUTER_API_URL` to a local big model endpoint or set `MEMDISK_LLM_MODE=mock` to keep everything offline. Swap in your own HTTPS endpoint if you want remote reasoning on infrastructure you fully control.

## Default Persona & Chat UX

Maya is the default AI-OS persona (MemDisk ver 0.1b). She behaves like a regular chatbot—type normal sentences and the terminal automatically routes them through `/ask`. The banner prints a **system directive** describing how to mount disks, personalize the experience, and even rename Maya. That directive (along with her greeting and metadata) now lives in [`disk/maya.dsk`](disk/maya.dsk), and the terminal auto-mounts it on boot so Maya's baseline memory is always active. Use it as the template for crafting new `.dsk` personas. Load a custom disk with `/disks load <persona.dsk>` (or the raw loader) and Maya will immediately adopt the new voice while still supporting the command deck.

## License

MIT /  Apache 2.0

## Roadmap

- **0.1B (today):** Local memory + terminal UI, deterministic mock mode, sample persona disks.
- **Next:**
  - True P2P `.dsk` sharing (torrents/IPFS bundles, git-style sync handshakes, gossip discovery).
  - Disk marketplaces + curator bundles straight from the terminal.
  - Visual disk viewer so you can browse JSON contents in the browser.
  - Plugin hooks so other apps can mount a MemDisk instead of rolling their own memory layer.

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
