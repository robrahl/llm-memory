# llm-memory

Local developer AI agent with persistent memory and Copilot integration.

## Quick Start - V0 Integration

**New to llm-memory Copilot integration?** Start here:
- 📖 **[V0 Quick Start Guide](docs/V0_QUICK_START.md)** — Get up and running in 5 minutes

## Docs
- Primary docs folder: `docs/`
  - `docs/V0_QUICK_START.md` — 5-minute setup guide for V0 (START HERE!)
  - `docs/copilot-v0-integration.md` — Detailed V0 integration guide
  - `docs/COPILOT_INTEGRATION.md` — Copilot V0/V1 integration summary
  - `docs/copilot-v1-mcp.md` — V1 MCP integration
  - `docs/copilot-v2-mcp.md` — V2.0 MCP integration (advanced tools)
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
