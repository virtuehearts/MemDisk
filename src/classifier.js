// Classifier Monk interface backed by the local Gemma runner
const memdisk = require("./memdisk");
const localLLM = require("./localLLM");

function summarizeDisk(name, diskData) {
  const persona = diskData.persona || "Unknown persona";
  const skills = (diskData.skills || []).join(", ");
  const themes = (diskData.knowledge?.themes || []).join(", ");
  const quotes = (diskData.knowledge?.quotes || []).slice(0, 2).join(" | ");
  return `Disk: ${name}\nPersona: ${persona}\nSkills: ${skills}\nThemes: ${themes}\nQuotes: ${quotes}`;
}

async function routeQuery(prompt, disks, encryptionKey = null) {
  const catalog = [];
  const loadedDisks = {};
  for (const disk of disks) {
    try {
      const data = await memdisk.loadDisk(disk, encryptionKey);
      loadedDisks[disk] = data;
      catalog.push(summarizeDisk(disk, data));
    } catch (err) {
      console.warn(`Failed to load disk ${disk}: ${err.message}`);
    }
  }

  if (!catalog.length) {
    return { relevantDisks: [], analysis: "No disks available", loadedDisks };
  }

  const instruction = `You are the MemDisk Classifier Monk (Gemma). Given a user prompt and a list of disks, select the disks that contain the most relevant memories. Respond strictly in JSON: {"selected": ["disk"...], "notes": "why"}. If multiple disks look relevant, include them all.`;
  const llmPrompt = `${instruction}\n\nUser Prompt:\n${prompt}\n\nDisk Catalog:\n${catalog.join("\n\n")}\n\nJSON:`;
  const completion = await localLLM.generateJSON(llmPrompt, {
    temperature: 0.1,
    maxTokens: 200,
  });

  let relevantDisks = disks;
  if (completion.json?.selected?.length) {
    relevantDisks = completion.json.selected.filter(name => loadedDisks[name]);
  }

  return {
    relevantDisks: relevantDisks.length ? relevantDisks : disks,
    analysis: completion.json?.notes || completion.raw,
    loadedDisks,
  };
}

module.exports = { routeQuery };