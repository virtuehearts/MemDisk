// CLI command handling and output sanitization

// Parse/sanitize LLM response before displaying in terminal
function sanitizeOutput(text) {
  // Strip operational meta/context blocks (e.g., "[MEMORY]" or "[INJECTED]")
  return text.replace(/\[MEMORY:.*?\]/gs, "").replace(/\[OPERATION:.*?\]/gs, "").trim();
}

module.exports = { sanitizeOutput };