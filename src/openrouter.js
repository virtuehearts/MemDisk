// OpenRouter LLM API wrapper (stub)
module.exports = {
  async sendQuery(context) {
    // TODO: integrate with OpenRouter API
    // Simulate LLM output for now
    return `LLM Output for prompt: "${context.prompt}" with memory: ${context.memory.length} chunks loaded`;
  }
};