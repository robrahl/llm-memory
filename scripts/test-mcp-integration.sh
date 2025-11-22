#!/bin/bash
# Test script for MCP server integration

set -e

echo "=== MCP Server Integration Test ==="
echo ""

# Check if agent is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Agent not running at http://localhost:3000"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

echo "✓ Agent is running"
echo ""

# Build MCP server
echo "Building MCP server..."
npm run build:mcp

if [ ! -f "dist/mcp-server.js" ]; then
    echo "❌ MCP server build failed"
    exit 1
fi

echo "✓ MCP server built successfully"
echo ""

# Test MCP server can start (in background, kill after check)
echo "Testing MCP server startup..."
node dist/mcp-server.js 2>&1 | head -5 &
MCP_PID=$!
sleep 2

# Check if process is still running
if kill -0 $MCP_PID 2>/dev/null; then
    echo "✓ MCP server starts successfully"
    kill $MCP_PID 2>/dev/null || true
    wait $MCP_PID 2>/dev/null || true
else
    echo "❌ MCP server failed to start"
    exit 1
fi

echo ""

# Test all V2 endpoints are accessible
echo "Testing V2 endpoints..."
echo ""

# Test /metrics
echo -n "Testing GET /metrics... "
if curl -s http://localhost:3000/metrics | jq -e '.storage, .system' > /dev/null; then
    echo "✓"
else
    echo "❌"
    exit 1
fi

# Test /adr/generate
echo -n "Testing POST /adr/generate... "
if curl -s -X POST http://localhost:3000/adr/generate \
    -H "Content-Type: application/json" \
    -d '{"title":"Test","context":"Test context","decision":"Test decision"}' \
    | jq -e '.success' > /dev/null; then
    echo "✓"
else
    echo "❌"
    exit 1
fi

# Test /scan/compliance
echo -n "Testing POST /scan/compliance... "
if curl -s -X POST http://localhost:3000/scan/compliance \
    -H "Content-Type: application/json" \
    -d '{"directory":"./src"}' \
    | jq -e '.success' > /dev/null; then
    echo "✓"
else
    echo "❌"
    exit 1
fi

# Test /refactor/suggest
echo -n "Testing POST /refactor/suggest... "
if curl -s -X POST http://localhost:3000/refactor/suggest \
    -H "Content-Type: application/json" \
    -d '{"code_snippet":"function test() { return 1; }"}' \
    | jq -e '.success' > /dev/null; then
    echo "✓"
else
    echo "❌"
    exit 1
fi

echo ""
echo "=== All Tests Passed ==="
echo ""
echo "MCP server is ready to use with VS Code Copilot"
echo ""
echo "Configuration:"
echo "  Command: node"
echo "  Args: [\"$(pwd)/dist/mcp-server.js\"]"
echo ""
echo "Add to ~/.vscode/mcp-servers.json or workspace settings"

