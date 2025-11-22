# Documentation Navigation Guide

Quick reference for navigating the llm-memory documentation.

## 📍 Where to Start

```
┌─────────────────────────────────────────────────────┐
│  NEW USER? Start here:                              │
│  → docs/getting-started/README.md                   │
│                                                      │
│  DEPLOYING? Choose your path:                       │
│  → docs/deployment/local/README.md (5 min setup)    │
│  → docs/deployment/nas/README.md (production)       │
│                                                      │
│  USING COPILOT? See integration guide:              │
│  → docs/copilot/README.md                           │
│                                                      │
│  NEED HELP? Check quick reference:                  │
│  → docs/copilot/quick-reference.md                  │
└─────────────────────────────────────────────────────┘
```

## 🗺️ Documentation Map

```
llm-memory/
│
├── README.md ...................... Main project overview
├── DOCUMENTATION_RESTRUCTURE.md ... Summary of doc changes
│
└── docs/
    ├── README.md .................. Documentation hub
    │
    ├── 📘 getting-started/ ........ START HERE
    │   └── README.md .............. Overview & setup paths
    │
    ├── 🚀 deployment/ ............. How to deploy
    │   ├── DEPLOYMENT.md .......... Overview of options
    │   ├── local/
    │   │   └── README.md .......... Local development guide
    │   └── nas/
    │       ├── README.md .......... Synology NAS guide
    │       └── git-setup.md ....... Git backup on NAS
    │
    ├── 🤖 copilot/ ................ Copilot integration
    │   ├── README.md .............. V0/V1/V2 comparison
    │   ├── v0-quick-start.md ...... Script integration (now)
    │   ├── v1-mcp-integration.md .. MCP integration (future)
    │   ├── v2-advanced-integration.md  Extended features
    │   └── quick-reference.md ..... Commands cheat sheet
    │
    ├── 📚 reference/ .............. Technical docs
    │   ├── architecture.md ........ System architecture
    │   ├── prd.md ................. Product requirements
    │   └── ui-development.md ...... UI development guide
    │
    └── 📦 archive/ ................ Historical docs
        ├── README.md
        ├── COPILOT_QUICK_REF.md ... Old quick ref
        ├── V2_QUICK_REF.md ........ Old V2 ref
        └── implementation-summaries/
            ├── V0_IMPLEMENTATION_SUMMARY.md
            ├── V1_1_WEB_UI_PLAN.md
            └── V2_0_IMPLEMENTATION_SUMMARY.md
```

## 🎯 Find by Task

### I want to...

**Get started with llm-memory**
→ [docs/getting-started/README.md](getting-started/README.md)

**Run it on my laptop**
→ [docs/deployment/local/README.md](deployment/local/README.md)

**Deploy to my Synology NAS**
→ [docs/deployment/nas/README.md](deployment/nas/README.md)

**Set up Git backup on NAS**
→ [docs/deployment/nas/git-setup.md](deployment/nas/git-setup.md)

**Integrate with GitHub Copilot**
→ [docs/copilot/README.md](copilot/README.md)

**Learn the V0 script integration**
→ [docs/copilot/v0-quick-start.md](copilot/v0-quick-start.md)

**Find commands and prompts**
→ [docs/copilot/quick-reference.md](copilot/quick-reference.md)

**Understand the architecture**
→ [docs/reference/architecture.md](reference/architecture.md)

**Develop the Web UI**
→ [docs/reference/ui-development.md](reference/ui-development.md)

**See what changed in documentation**
→ [DOCUMENTATION_RESTRUCTURE.md](../DOCUMENTATION_RESTRUCTURE.md)

## 📋 Find by Topic

### Deployment
- [Overview](deployment/DEPLOYMENT.md) - Compare local vs NAS
- [Local Setup](deployment/local/README.md) - Docker Desktop guide
- [NAS Setup](deployment/nas/README.md) - Synology deployment
- [Git on NAS](deployment/nas/git-setup.md) - Backup configuration

### Copilot
- [Overview](copilot/README.md) - Choose V0/V1/V2
- [V0 Guide](copilot/v0-quick-start.md) - Available now
- [V1 Guide](copilot/v1-mcp-integration.md) - Planned
- [V2 Guide](copilot/v2-advanced-integration.md) - Advanced
- [Quick Ref](copilot/quick-reference.md) - All commands

### Technical
- [Architecture](reference/architecture.md) - System design
- [PRD](reference/prd.md) - Requirements
- [UI Dev](reference/ui-development.md) - Frontend guide

### Historical
- [Archive](archive/README.md) - Old documentation

## 🔍 Quick Search

| Looking for... | Go to... |
|----------------|----------|
| Docker commands | [Quick Reference](copilot/quick-reference.md#docker-commands) |
| Troubleshooting | [Local](deployment/local/README.md#troubleshooting) or [NAS](deployment/nas/README.md#troubleshooting) |
| Environment variables | [Quick Reference](copilot/quick-reference.md#environment-variables) |
| API endpoints | [Quick Reference](copilot/quick-reference.md#api-endpoints) |
| Copilot prompts | [Quick Reference](copilot/quick-reference.md#copilot-chat-prompts) |
| Shell aliases | [Quick Reference](copilot/quick-reference.md#shell-aliases) |

## 💡 Tips

1. **Start with Getting Started** - Even if experienced, skim it for overview
2. **Bookmark Quick Reference** - You'll use it often
3. **Choose deployment first** - Local for testing, NAS for production
4. **Try V0 Copilot first** - Simple and works immediately
5. **Check troubleshooting sections** - Most issues covered there

## 🆘 Still Lost?

1. Check [docs/README.md](README.md) for documentation hub
2. Look at [Quick Reference](copilot/quick-reference.md) for commands
3. Review [Getting Started](getting-started/README.md) for overview
4. See [Architecture](reference/architecture.md) for technical details

---

**Last Updated:** 2025-11-22  
**Navigation Version:** 1.0
