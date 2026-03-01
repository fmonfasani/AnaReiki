/**
 * TEAM — Step 5: Concurrent multi-role agents
 * Runs three specialized Codex agents in parallel:
 *   - Guardian: bug detection
 *   - Builder:  feature implementation
 *   - Tester:   test writing
 *
 * Usage: node agent/team.js
 * Usage (single role): node agent/team.js guardian
 */

const { execa } = require("execa");

const PROJECT =
    "C:/Users/fmonf/Desktop/Software Enginnering LAPTOP/Agencia B2B/AnaReiki";

// ──────────────────────────────────────────────
// Agent roles
// ──────────────────────────────────────────────
const AGENTS = {
    guardian: {
        label: "🛡️  Guardian (QA/Bugs)",
        prompt:
            "Act as a senior QA engineer. Review the entire repository and detect bugs, edge cases, security issues, and error handling gaps. For each issue found, propose a fix with a code diff.",
    },
    builder: {
        label: "🔨 Builder (Features)",
        prompt:
            "Act as a senior full-stack developer. Review the repository and identify missing or incomplete functionality. Implement any missing features, API endpoints, or UI components following the existing architecture and code style.",
    },
    tester: {
        label: "🧪 Tester (Tests)",
        prompt:
            "Act as a QA automation engineer. Review the repository and write regression tests using Vitest for all components and utility functions that currently have no test coverage. Prioritize: BookingCalendar, MoodTracker, middleware, and Supabase client factories.",
    },
};

// ──────────────────────────────────────────────
// Run a single agent
// ──────────────────────────────────────────────
async function runAgent(role) {
    const agent = AGENTS[role];
    if (!agent) {
        console.error(`Unknown role: ${role}. Available: ${Object.keys(AGENTS).join(", ")}`);
        process.exit(1);
    }

    console.log(`\n${agent.label}`);
    console.log("─".repeat(50));

    try {
        await execa("codex", ["exec", agent.prompt], {
            cwd: PROJECT,
            stdio: "inherit",
        });
        console.log(`\n✅ ${agent.label} — done.`);
    } catch (e) {
        console.error(`\n❌ ${agent.label} — failed:`, e.message);
    }
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
    const role = process.argv[2]; // optional: node team.js guardian

    if (role) {
        // Single agent mode
        await runAgent(role);
    } else {
        // Full team mode — run all concurrently
        console.log("🚀 LAUNCHING FULL AGENT TEAM (concurrent)\n");
        console.log("Roles active:", Object.keys(AGENTS).join(", "));
        console.log("=".repeat(50));

        const tasks = Object.keys(AGENTS).map((r) => runAgent(r));
        await Promise.allSettled(tasks);

        console.log("\n" + "=".repeat(50));
        console.log("✅ ALL AGENTS COMPLETE");
        console.log("=".repeat(50));
    }
}

main();
