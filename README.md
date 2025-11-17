# llm-memory

Local developer AI agent with persistent memory and Copilot integration.

## Docs
- Primary docs folder: `docs/`
  - `docs/COPILOT_INTEGRATION.md` — Copilot V0/V1 integration. (Merged from legacy `COPILOT.md`)
  - `docs/prd.md` — Project Design Review
  - `docs/architecture.md` — Architecture specification
  - `docs/COPILOT_QUICK_REF.md` — Quick prompts for Copilot

## Archive
- `archive/` contains old/archived docs or test artifacts that are kept for history
  - `archive/COPILOT_TESTING.md`, `archive/COPILOT_START_HERE.md`

## Test area
- `dist_test/` holds isolated test documentation and examples for Copilot testing

## Git Remotes — Parallel Push

This repository is configured to push to **two remotes in parallel**:
- **GitHub** (primary): `https://github.com/robrahl/llm-memory.git`
- **NAS Backup** (mirror): `ssh://robertorahl@rahlnas3:/volume1/git/llm-memory.git`

### Push Commands
```powershell
# Push to both remotes (parallel)
git push origin main

# Push to GitHub only
git push github main

# Push to NAS backup only
git push backup main

# Push all branches and tags to both
git push origin --all --tags
```

Both remotes stay in sync automatically with each push.

---

For detailed usage of the Copilot integration, see `docs/COPILOT_INTEGRATION.md`.
