const { spawn } = require("child_process");

const processes = [];

function startProcess(label, command, args) {
  const child = spawn(command, args, { stdio: "inherit" });
  processes.push(child);
  child.on("exit", code => {
    console.log(`${label} exited with code ${code}`);
    shutdown(code ?? 0);
  });
}

function shutdown(code = 0) {
  while (processes.length) {
    const proc = processes.pop();
    if (!proc.killed) {
      proc.kill("SIGINT");
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

startProcess("backend", "node", ["src/server.js"]);
startProcess("frontend", "node", ["scripts/static-server.js"]);
