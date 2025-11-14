// AI-OS Terminal Emulator Frontend

document.getElementById("input").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const cmd = e.target.value;
    if (!cmd) return;
    document.getElementById("output").innerHTML += `<div>> ${cmd}</div>`;
    e.target.value = "";

    // Demo command: load disk
    if (cmd.startsWith("load ")) {
      const diskName = cmd.split(" ")[1];
      const res = await fetch(`/api/disk/load/${diskName}`);
      const diskData = await res.json();
      document.getElementById("output").innerHTML += `<pre>[DISK LOADED]\n${JSON.stringify(diskData, null, 2)}</pre>`;
    }
    // Demo command: ask LLM
    else if (cmd.startsWith("ask ")) {
      const prompt = cmd.slice(4);
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, disks: ["example.dsk"] }),
      });
      const { output } = await res.json();
      document.getElementById("output").innerHTML += `<pre>${output}</pre>`;
    }
    // Help
    else if (cmd === "help") {
      document.getElementById("output").innerHTML += `<pre>Commands:\n- load [diskname.dsk]\n- ask [prompt]\n- help</pre>`;
    }
    else {
      document.getElementById("output").innerHTML += `<pre>Error: Unknown command\nType 'help' for list of commands.</pre>`;
    }
  }
});