# GitHub Copilot Integration

llm-memory integrates with GitHub Copilot to provide context-aware coding assistance based on your team's architectural policies and knowledge base.

## Available Versions

### V0 - Manual Script Integration (Available Now)
**Status:** ✅ Ready to use  
**Best for:** Immediate use, simple setup, no additional dependencies

Use a bash script to query llm-memory and generate context files that Copilot can read.

→ [V0 Quick Start Guide](v0-quick-start.md)

### V1 - MCP Server Integration (Future)
**Status:** 🚧 Planned  
**Best for:** Seamless integration, real-time tool calls, no manual steps

Direct integration using Model Context Protocol (MCP) for automatic tool calls from Copilot.

→ [V1 MCP Integration Guide](v1-mcp-integration.md)

### V2 - Advanced MCP Tools (Future)
**Status:** 🚧 Planned  
**Best for:** Advanced workflows, policy validation, compliance checking

Extended MCP server with additional tools for advanced use cases.

→ [V2 Advanced Integration Guide](v2-advanced-integration.md)

## Quick Comparison

| Feature | V0 (Script) | V1 (MCP) | V2 (Advanced MCP) |
|---------|-------------|----------|-------------------|
| Query knowledge base | ✅ Manual | ✅ Automatic | ✅ Automatic |
| Context generation | ✅ File-based | ✅ Real-time | ✅ Real-time |
| Setup complexity | ⭐ Simple | ⭐⭐ Moderate | ⭐⭐⭐ Complex |
| Dependencies | Bash, curl | Node.js, MCP | Node.js, MCP |
| Policy validation | ❌ | ❌ | ✅ |
| Code compliance check | ❌ | ❌ | ✅ |
| Health monitoring | ✅ | ✅ | ✅ |

## Which Version Should I Use?

### Start with V0 if:
- ✅ You want to get started immediately
- ✅ You're comfortable with bash scripts
- ✅ You don't mind manual context generation
- ✅ You want minimal dependencies

### Upgrade to V1 when:
- ⏳ MCP support is stable in VS Code
- ⏳ You want automatic tool calls from Copilot
- ⏳ You're ready to install MCP dependencies
- ⏳ You want seamless integration

### Consider V2 if:
- 🔮 You need policy validation
- 🔮 You want compliance checking
- 🔮 You have complex governance requirements

## Getting Started

1. **Choose your deployment method:**
   - [Local Development](../deployment/local/README.md)
   - [Synology NAS](../deployment/nas/README.md)

2. **Start with V0:**
   - [V0 Quick Start Guide](v0-quick-start.md)
   - Test the integration
   - Build your workflow

3. **Upgrade to V1 when ready:**
   - [V1 MCP Integration Guide](v1-mcp-integration.md)
   - Install MCP dependencies
   - Configure VS Code

## Common Workflows

### Daily Coding Workflow (V0)

```bash
# Morning: Get context on naming conventions
./scripts/copilot-context.sh "naming conventions"

# VS Code Copilot Chat:
# "Based on .vscode/copilot-context.md, create a new service"

# Afternoon: Get error handling patterns
./scripts/copilot-context.sh "error handling"

# VS Code: Use the generated context for your code
```

### Real-time Workflow (V1+)

```
VS Code Copilot Chat:
@llm-memory query "What are our naming conventions?"
# Copilot automatically calls the MCP tool and gets the answer
```

## Troubleshooting

### Agent Unreachable
- Check if llm-memory is running: `curl http://localhost:3000/health`
- View logs: `docker-compose logs -f agent`
- See [Local Troubleshooting](../deployment/local/README.md#troubleshooting)

### No Context Generated (V0)
- Check script permissions: `chmod +x scripts/copilot-context.sh`
- Verify Agent URL in script
- Run health check: `./scripts/copilot-context.sh --health`

### MCP Tools Not Available (V1+)
- Verify MCP is built: `ls dist/mcp-server.js`
- Check VS Code config: `~/.vscode/mcp-servers.json`
- Restart VS Code completely

## Next Steps

- [Start with V0 Integration](v0-quick-start.md)
- [Load Example Policies](../reference/example-policies.md)
- [Explore Architecture](../reference/architecture.md)
- [Quick Reference Commands](quick-reference.md)
