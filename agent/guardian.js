const chokidar = require("chokidar");
const { execa } = require("execa");

const PROJECT = process.cwd();

console.log("Guardian agent running...");

const watcher = chokidar.watch("../src", {
    ignoreInitial: true,
    persistent: true,
});

watcher.on("change", async (file) => {
    console.log("Change detected:", file);

    await execa("codex", [
        "review the recent code change and fix any bug introduced by it"
    ], { stdio: "inherit" });
});