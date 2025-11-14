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