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
- **Gemma (Classifier Monk & Oracle)**: Local LLM routed through Ollama, both ranks disks and answers prompts end-to-end.
- **Web Terminal**: MSDOS-like AI-OS for interactive sessions, loading memory disks, executing commands.

## How It Works

1. User interacts in terminal front-end.
2. Commands (e.g. `load dark_poetry.dsk`) select local memory files.
3. Classifier Monk (Gemma via Ollama) reviews every floppy and chooses what matters.
4. The same local LLM receives the curated memory + prompt and crafts a response.
5. Sanitized output displayed to user (memories and ops context stripped).

## Features

- Finite local memory units (1.44MB each, as `.dsk` JSON files)
- SHA256 + Bitcoin-style keypair crypto
- SQLite for storage, audit trail, versioning
- Classifier Monk + Oracle share a single local Gemma runner (Ollama)
- Context injection protocol that trims floppy JSON to fit LLM limits
- Optional disk encryption
- Modular terminal web frontend with routing telemetry

## Getting Started

### 1. Prepare a local Gemma runner

Install [Ollama](https://ollama.com/) (macOS, Linux, or Windows WSL) and start the daemon:

```bash
ollama pull gemma:2b
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

### 2. Install Node dependencies

```bash
npm install
```

### 3. Start the MemDisk backend

```bash
npm run start
```

This launches the Express API on `http://localhost:3000`.

### 4. Launch the AI-OS terminal

Open `frontend/index.html` in your browser (or serve the `frontend/` folder with any static HTTP server). The UI will communicate with the backend through the same origin.

## Terminal Commands

Inside the browser terminal UI you can run:

```
disks                 # list .dsk files inside /disk
load example.dsk      # load a floppy into the current session
mem                   # show currently mounted disks
ask write a poem ...  # send the prompt + mounted floppies to Gemma
clear                 # clear the terminal
help                  # see this list again
```

Each `ask` call shows the sanitized Gemma response plus an expandable "Routing" block that reveals which disks were selected, why they were chosen, and the raw classifier output.

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
