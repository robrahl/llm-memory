# llm-memory

Local developer AI agent with persistent memory and GitHub Copilot integration.

## 🚀 Quick Start

Choose your setup path:

- **[Local Development](docs/deployment/local/README.md)** - Run on your machine (5 minutes)
- **[Synology NAS](docs/deployment/nas/README.md)** - Deploy for always-on access

**First time here?** → [Getting Started Guide](docs/getting-started/README.md)

## 📚 Documentation

### Getting Started
- **[Getting Started](docs/getting-started/README.md)** - Overview and setup paths

### Deployment
- **[Local Setup](docs/deployment/local/README.md)** - Docker Desktop on Windows/Mac/Linux
- **[NAS Deployment](docs/deployment/nas/README.md)** - Synology DSM 7.2+ setup
- **[Git Setup on NAS](docs/deployment/nas/git-setup.md)** - Configure NAS as Git remote

### Copilot Integration
- **[Copilot Overview](docs/copilot/README.md)** - Integration options (V0/V1/V2)
- **[V0 Quick Start](docs/copilot/v0-quick-start.md)** - Manual script integration (ready now)
- **[Quick Reference](docs/copilot/quick-reference.md)** - Commands and prompts cheat sheet

### Reference
- **[Architecture](docs/reference/architecture.md)** - Technical architecture
- **[PRD](docs/reference/prd.md)** - Product requirements document
- **[UI Development](docs/reference/ui-development.md)** - Web UI development guide

## What is llm-memory?

llm-memory is a persistent memory service for LLMs that:
- 🧠 Stores architectural policies and team knowledge
- 🔍 Provides semantic search using pgvector
- 🤖 Integrates with GitHub Copilot for context-aware coding
- 🐳 Deploys easily via Docker (local or NAS)
- 🎨 Includes a modern Web UI for policy management

## Features

- **Persistent Memory**: Store coding standards, patterns, and decisions in PostgreSQL
- **Semantic Search**: Find relevant policies using natural language queries
- **Copilot Integration**: Get context-aware suggestions based on your team's knowledge
- **Vector Embeddings**: Powered by pgvector for similarity search
- **Web Interface**: Modern UI for managing policies and viewing history
- **Flexible Deployment**: Run locally or on Synology NAS

## Contributing

Contributions welcome! Please read the [Architecture Guide](docs/reference/architecture.md) first.

## License

See LICENSE file for details.

---

**Need help?** Check the [Quick Reference](docs/copilot/quick-reference.md) or [Troubleshooting Guide](docs/deployment/local/README.md#troubleshooting).
