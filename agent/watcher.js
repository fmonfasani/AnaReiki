/**
 * WATCHER — Agent Guardian
 * Monitors src/ for file changes and triggers Codex:
 *   1. Audits the change for side effects
 *   2. Runs build + lint + test
 *   3. If anything fails → sends error to Codex for auto-fix
 *   4. Commits the fix automatically
 */

const chokidar = require("chokidar");
const { execa } = require("execa");
const simpleGit = require("simple-git");

const PROJECT =
    "C:/Users/fmonf/Desktop/Software Enginnering LAPTOP/Agencia B2B/AnaReiki";
const git = simpleGit(PROJECT);

console.log("🤖 Agent Guardian watching project...");
console.log("ℹ️  Build checks run separately via: npm run build-watch\n");

// ──────────────────────────────────────────────
// STEP 3: Auto-testing pipeline
// ──────────────────────────────────────────────
async function runQualityChecks() {
    // Build is intentionally excluded here — it's slow.
    // Build runs separately in buildWatcher.js (every 10 min) and nightly.js (3AM).
    const steps = [
        { label: "lint", cmd: "npm", args: ["run", "lint"], cwd: PROJECT },
        // Uncomment when Vitest is configured:
        // { label: "test", cmd: "npm", args: ["test"],           cwd: PROJECT },
    ];

    for (const step of steps) {
        try {
            console.log(`   ▶ Running ${step.label}...`);
            await execa(step.cmd, step.args, { cwd: step.cwd, stdio: "pipe" });
            console.log(`   ✅ ${step.label} passed`);
        } catch (err) {
            const errorLog = err.stderr || err.stdout || err.message;
            console.error(`   ❌ ${step.label} FAILED. Sending to Codex...`);

            // Auto-fix: send failure to Codex
            await execa(
                "codex",
                [
                    "exec",
                    `the ${step.label} failed with this error, analyze it and fix the issue:\n\n${errorLog}`,
                ],
                { cwd: PROJECT, stdio: "inherit" }
            );
            return false; // stop pipeline on failure
        }
    }
    return true;
}

// ──────────────────────────────────────────────
// STEP 4: Auto-commit after fix
// ──────────────────────────────────────────────
async function autoCommit(changedFile) {
    try {
        const status = await git.status();
        if (status.files.length === 0) {
            console.log("   ℹ️  Nothing to commit.");
            return;
        }
        await git.add(".");
        await git.commit(`agent: auto-fix after change in ${changedFile}`);
        console.log("   ✅ Auto-committed.");
    } catch (e) {
        console.error("   ⚠️  Auto-commit failed:", e.message);
    }
}

// ──────────────────────────────────────────────
// Main watcher loop
// ──────────────────────────────────────────────
const watcher = chokidar.watch(PROJECT + "/src", {
    ignoreInitial: true,
    persistent: true,
    ignored: /(^|[/\\])\../, // ignore dotfiles
});

watcher.on("change", async (filePath) => {
    const rel = filePath.replace(PROJECT + "/", "");
    console.log(`\n📁 File changed: ${rel}`);
    console.log("──────────────────────────────────────");

    // STEP 1: Audit the change
    try {
        console.log("   ▶ Step 1: Auditing change with Codex...");
        await execa(
            "codex",
            [
                "exec",
                `a file was modified: ${rel}. Audit the change, detect potential side effects and fix them if needed.`,
            ],
            { cwd: PROJECT, stdio: "inherit" }
        );
    } catch (e) {
        console.error("   ⚠️  Codex audit failed:", e.message);
    }

    // STEP 2 & 3: Run quality checks (build + lint + test)
    console.log("   ▶ Step 2: Running quality checks...");
    const passed = await runQualityChecks();

    // STEP 4: Auto-commit if checks pass
    if (passed) {
        console.log("   ▶ Step 3: Auto-committing fix...");
        await autoCommit(rel);
    }

    console.log("──────────────────────────────────────\n");
});

watcher.on("error", (err) => console.error("Watcher error:", err));
process.on("SIGINT", () => {
    console.log("\n🛑 Agent Guardian stopped.");
    watcher.close();
    process.exit(0);
});