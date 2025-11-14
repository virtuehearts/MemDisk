// AI-OS Terminal Emulator Frontend

const state = {
  loadedDisks: [],
};

function appendOutput(html) {
  const output = document.getElementById("output");
  output.innerHTML += html;
  output.scrollTop = output.scrollHeight;
}

async function listDisks() {
  const res = await fetch("/api/disks");
  const data = await res.json();
  return data.disks || [];
}

document.getElementById("input").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const cmd = e.target.value;
    if (!cmd) return;
    appendOutput(`<div>> ${cmd}</div>`);
    e.target.value = "";

    // Demo command: load disk
    if (cmd.startsWith("load ")) {
      const diskName = cmd.split(" ")[1];
      try {
        const res = await fetch(`/api/disk/load/${diskName}`);
        if (!res.ok) throw new Error("Unable to load disk");
        const diskData = await res.json();
        if (!state.loadedDisks.includes(diskName)) {
          state.loadedDisks.push(diskName);
        }
        appendOutput(`<pre>[DISK LOADED]\n${JSON.stringify(diskData, null, 2)}</pre>`);
      } catch (err) {
        appendOutput(`<pre class="error">Error: ${err.message}</pre>`);
      }
    }
    // Demo command: ask LLM
    else if (cmd.startsWith("ask ")) {
      const prompt = cmd.slice(4);
      if (!state.loadedDisks.length) {
        appendOutput(`<pre class="error">Load a disk first with 'load [disk]'.</pre>`);
        return;
      }
      try {
        const res = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, disks: state.loadedDisks }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        appendOutput(`<pre>${data.output}</pre>`);
        appendOutput(`<details><summary>Routing</summary><pre>${JSON.stringify(data.routing, null, 2)}</pre></details>`);
      } catch (err) {
        appendOutput(`<pre class="error">Query error: ${err.message}</pre>`);
      }
    }
    else if (cmd === "disks") {
      const disks = await listDisks();
      appendOutput(`<pre>Available disks:\n${disks.join("\n")}</pre>`);
    }
    else if (cmd === "mem") {
      appendOutput(`<pre>Loaded disks:\n${state.loadedDisks.join("\n") || "(none)"}</pre>`);
    }
    else if (cmd === "clear") {
      document.getElementById("output").innerHTML = "";
    }
    // Help
    else if (cmd === "help") {
      appendOutput(`<pre>Commands:\n- disks (list available)\n- load [diskname.dsk]\n- mem (show loaded)\n- ask [prompt]\n- clear\n- help</pre>`);
    }
    else {
      appendOutput(`<pre>Error: Unknown command\nType 'help' for list of commands.</pre>`);
    }
  }
});