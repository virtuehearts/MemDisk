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
