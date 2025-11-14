# MemDisk Project File Plan (v0.1 Demo MVP)

This file details the intended project structure for MemDisk 0.1B, a peer-to-peer distributed memory system for large language models.

## Top-Level Files

- **README.md** — Core protocol and instructions  
- **package.json** — Node.js setup and dependencies
- **.gitignore** — Ignore node_modules, database, disk files, etc.

## Source Directory: `/src`

- **server.js** — Node.js API server (Express)
- **memdisk.js** — MemDisk manager: load/append/recall/rewrite/encrypt/decrypt utilities
- **classifier.js** — Gemma LLM interface (stub/mock for further expansion)
- **crypto.js** — SHA256, Bitcoin wallet keygen, encryption routines
- **db.js** — SQLite schema/init
- **openrouter.js** — API wrapper for main LLM session
- **commands.js** — CLI-style command manager for terminal frontend

## Frontend Directory: `/frontend`

- **index.html** — Terminal AI-OS web UI
- **terminal.js** — Terminal emulator with command handling
- **style.css** — Styling for terminal interface

## Disk Directory: `/disk`

- **example.dsk** — Example memory disk (JSON with test knowledge/persona/skills)

## Optional: `/docs`

- Expanded protocol documentation, architecture, and API usage; may be added as the project grows.

---

> This plan is for the MVP and initial demonstration.  
> Future versions may add additional utilities, protocols, or integration modules.