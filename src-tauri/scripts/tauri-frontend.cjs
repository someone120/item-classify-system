const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const mode = process.argv[2];
if (mode !== "dev" && mode !== "build") {
  console.error("Usage: node scripts/tauri-frontend.cjs <dev|build>");
  process.exit(1);
}

const frontendDir = path.resolve(__dirname, "..", "..", "frontend");
if (!fs.existsSync(frontendDir)) {
  console.error(`frontend directory not found: ${frontendDir}`);
  process.exit(1);
}

execSync(`npm run ${mode}`, { cwd: frontendDir, stdio: "inherit" });
