/**
 * BUILD WATCHER — Periodic build checker
 * Runs Next.js build every 10 minutes.
 * If it fails → sends error log to Codex for auto-fix.
 *
 * Keeps build separate from file watcher (build is slow, lint is fast).
 *
 * Usage: node agent/buildWatcher.js
 *        npm run build-watch
 */

const { execa } = require("execa");

const PROJECT =
    "C:/Users/fmonf/Desktop/Software Enginnering LAPTOP/Agencia B2B/AnaReiki";
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

async function build() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n🔨 [${timestamp}] Running build check...`);

    try {
        await execa("npm", ["run", "build"], {
            cwd: PROJECT,
            stdio: "pipe",
        });
        console.log(`   ✅ Build passed`);
    } catch (err) {
        const errorLog = err.stderr || err.stdout || err.message;
        console.error(`   ❌ Build FAILED. Sending to Codex for auto-fix...`);
        console.error(`   Error preview: ${errorLog.slice(0, 200)}...`);

        try {
            await execa(
                "codex",
                [
                    "exec",
                    `the project build failed. Analyze the error and fix the code:\n\n${errorLog}`,
                ],
                { cwd: PROJECT, stdio: "inherit" }
            );
            console.log("   ✅ Codex applied fix. Next build cycle will verify.");
        } catch (codexErr) {
            console.error("   ⚠️  Codex fix also failed:", codexErr.message);
        }
    }
}

console.log("🔨 Build Watcher started");
console.log(`   Checking build every ${INTERVAL_MS / 60000} minutes\n`);

// Run immediately on start, then every 10 min
build();
setInterval(build, INTERVAL_MS);

process.on("SIGINT", () => {
    console.log("\n🛑 Build Watcher stopped.");
    process.exit(0);
});