/**
 * NIGHTLY — Autonomous maintenance agent (runs daily at 3:00 AM)
 * Scans the full repo for bugs, security issues, and missing tests.
 * Runs quality checks. Commits fixes automatically.
 */

const cron = require("node-cron");
const { execa } = require("execa");
const simpleGit = require("simple-git");

const PROJECT =
    "C:/Users/fmonf/Desktop/Software Enginnering LAPTOP/Agencia B2B/AnaReiki";
const git = simpleGit(PROJECT);

console.log("🌙 Nightly agent scheduled (runs at 3:00 AM daily)\n");

async function runNightlyMaintenance() {
    console.log("=".repeat(50));
    console.log("🌙 NIGHTLY MAINTENANCE STARTED —", new Date().toISOString());
    console.log("=".repeat(50));

    // 1. Full repo scan
    try {
        console.log("\n▶ [1/4] Scanning for bugs and security issues...");
        await execa(
            "codex",
            [
                "exec",
                "scan the entire repository for bugs, security vulnerabilities, missing error handling, and missing tests. Propose and apply patches for each issue found.",
            ],
            { cwd: PROJECT, stdio: "inherit" }
        );
    } catch (e) {
        console.error("  ⚠️  Scan step failed:", e.message);
    }

    // 2. Build check
    try {
        console.log("\n▶ [2/4] Running build check...");
        await execa("npm", ["run", "build"], { cwd: PROJECT, stdio: "pipe" });
        console.log("  ✅ Build passed");
    } catch (err) {
        const errorLog = err.stderr || err.stdout || err.message;
        console.error("  ❌ Build failed. Sending to Codex for auto-fix...");
        await execa(
            "codex",
            ["exec", `the nightly build failed. Fix it:\n\n${errorLog}`],
            { cwd: PROJECT, stdio: "inherit" }
        );
    }

    // 3. Lint check
    try {
        console.log("\n▶ [3/4] Running lint check...");
        await execa("npm", ["run", "lint"], { cwd: PROJECT, stdio: "pipe" });
        console.log("  ✅ Lint passed");
    } catch (err) {
        const errorLog = err.stderr || err.stdout || err.message;
        console.error("  ❌ Lint failed. Sending to Codex for auto-fix...");
        await execa(
            "codex",
            ["exec", `fix these lint errors:\n\n${errorLog}`],
            { cwd: PROJECT, stdio: "inherit" }
        );
    }

    // 4. Auto-commit nightly fixes
    try {
        console.log("\n▶ [4/4] Committing nightly fixes...");
        const status = await git.status();
        if (status.files.length > 0) {
            await git.add(".");
            await git.commit(`agent(nightly): automated maintenance ${new Date().toISOString().slice(0, 10)}`);
            console.log("  ✅ Nightly fixes committed.");
        } else {
            console.log("  ℹ️  No changes to commit.");
        }
    } catch (e) {
        console.error("  ⚠️  Commit failed:", e.message);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🌙 NIGHTLY MAINTENANCE DONE —", new Date().toISOString());
    console.log("=".repeat(50) + "\n");
}

// Schedule: every day at 3:00 AM
cron.schedule("0 3 * * *", runNightlyMaintenance);

// Uncomment to run immediately for testing:
// runNightlyMaintenance();