# Skill: git

## Purpose
Allows the agent to inspect commit history, diffs, and detect regressions in the AnaReiki repository.

## Repository Info
```
Repo root: C:\Users\fmonf\Desktop\Software Enginnering LAPTOP\Agencia B2B\AnaReiki\
VCS:       Git
```

## Common Commands

### Recent history
```powershell
cd "C:\Users\fmonf\Desktop\Software Enginnering LAPTOP\Agencia B2B\AnaReiki"
git log --oneline -20
```

### Show last commit details
```powershell
git show --stat HEAD
```

### Diff of uncommitted changes
```powershell
git diff
git diff --staged
```

### Diff between two commits
```powershell
git diff <commit-a> <commit-b> -- <optional-file>
```

### Who changed a specific line
```powershell
git blame src/app/page.tsx
```

### Find when a bug was introduced
```powershell
git log --all --oneline -- src/components/BookingCalendar.tsx
```

### Check branch status
```powershell
git status
git branch -a
```

## Regression Detection Workflow
1. Run `git log --oneline -20` to see recent commits
2. If behavior changed, run `git diff <old-commit> HEAD -- <file>`
3. Use `git blame` to identify authorship of problematic lines
4. Use `git stash` to isolate working state for comparison

## Usage Instructions
Use the MCP `git` server or run commands via the `shell` skill.
Always check git log before reporting a bug — it may already be documented in commit messages.
