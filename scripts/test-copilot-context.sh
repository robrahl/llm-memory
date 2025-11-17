#!/bin/bash
# Quick test: Generate Copilot context from running Agent

set -e

AGENT_HOST=${AGENT_HOST:-localhost}
AGENT_PORT=${AGENT_PORT:-3000}
OUTPUT_FILE=".vscode/copilot-context.md"

mkdir -p .vscode

echo "Fetching policy context from Agent..."

# Query 1: Naming conventions
POLICY1=$(curl -s -X POST "http://${AGENT_HOST}:${AGENT_PORT}/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "naming convention", "topK": 1}')

# Query 2: Error handling
POLICY2=$(curl -s -X POST "http://${AGENT_HOST}:${AGENT_PORT}/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "error handling", "topK": 1}')

# Query 3: Code review
POLICY3=$(curl -s -X POST "http://${AGENT_HOST}:${AGENT_PORT}/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "code review", "topK": 1}')

# Generate markdown for Copilot
cat > "$OUTPUT_FILE" << 'EOF'
# llm-memory Context for Copilot

Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Architectural Policies

### 1. Naming Convention
EOF

echo "$POLICY1" | jq -r '.answer' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'EOF'
### 2. Error Handling
EOF

echo "$POLICY2" | jq -r '.answer' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'EOF'
### 3. Code Review Standards
EOF

echo "$POLICY3" | jq -r '.answer' >> "$OUTPUT_FILE"

echo "✓ Context written to $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Open VS Code"
echo "2. Reference this file in Copilot Chat:"
echo "   '@copilot Based on .vscode/copilot-context.md, generate a new AuthService class'"
echo ""
cat "$OUTPUT_FILE"
