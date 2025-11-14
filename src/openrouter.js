// Local LLM orchestrator (Gemma via Ollama)
const localLLM = require("./localLLM");

function buildPrompt(context) {
  const header = `You are Jero, the MemDisk AI. Use the supplied floppy memories to answer the user.`;
  const memoryText = context.memory
    .map((chunk, idx) => {
      const body = typeof chunk.content === "string"
        ? chunk.content
        : JSON.stringify(chunk.content, null, 2);
      return `Memory ${idx + 1}: (${chunk.disk})\n${body}`;
    })
    .join("\n\n");

  return `${header}\n\nUser Prompt:\n${context.prompt}\n\nLoaded Memories:\n${memoryText}`;
}

module.exports = {
  async sendQuery(context) {
    const prompt = buildPrompt(context);
    const response = await localLLM.generateText(prompt, {
      maxTokens: parseInt(process.env.MEMDISK_LLM_MAX_TOKENS || "256", 10),
      temperature: parseFloat(process.env.MEMDISK_LLM_TEMP || "0.6"),
    });
    return response;
  }
};