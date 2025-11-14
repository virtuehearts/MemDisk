const express = require("express");
const path = require("path");

const PORT = process.env.MEMDISK_FRONTEND_PORT || 4173;
const app = express();
const frontendDir = path.join(__dirname, "../frontend");

app.use(express.static(frontendDir));

app.listen(PORT, () => {
  console.log(`MemDisk frontend available at http://localhost:${PORT}`);
});
