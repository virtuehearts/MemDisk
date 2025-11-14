// Classifier Monk interface (Gemma LLM stub)
// For now, simulate classification (real Gemma integration required)
module.exports = {
  async routeQuery(prompt, disks) {
    // In real use: call Gemma LLM w/ tools/memory set to select relevant disks
    // For now, select all disks containing prompt keyword (mock)
    const relevantDisks = disks.filter(disk => disk.toLowerCase().includes(prompt.toLowerCase()));
    return { relevantDisks, analysis: "Stub classifier result" };
  }
};