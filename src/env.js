const fs = require("fs");
const path = require("path");

let loaded = false;

function loadEnv() {
  if (loaded) {
    return;
  }
  loaded = true;
  const envPath = process.env.MEMDISK_ENV_FILE || path.join(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const contents = fs.readFileSync(envPath, "utf8");
  contents
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .forEach(line => {
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) {
        return;
      }
      const key = line.slice(0, eqIndex).trim();
      const value = line.slice(eqIndex + 1).trim().replace(/^"|"$/g, "");
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    });
}

module.exports = { loadEnv };
