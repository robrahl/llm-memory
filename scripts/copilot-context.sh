#!/bin/bash
# copilot-context.sh
# Simple script to inject llm-memory context into VS Code Copilot sessions
# Usage: ./scripts/copilot-context.sh "your question here"

set -e

# Configuration
AGENT_HOST="${AGENT_HOST:-localhost}"
AGENT_PORT="${AGENT_PORT:-3000}"
CONTEXT_FILE=".vscode/copilot-context.md"
QUERIES_LOG=".vscode/copilot-queries.log"

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create .vscode directory if not exists
mkdir -p .vscode

# Function: Query the Agent
query_agent() {
  local query="$1"
  
  echo -e "${BLUE}🔍 Querying llm-memory Agent...${NC}"
  
  # Call Agent Service
  response=$(curl -s -X POST "http://${AGENT_HOST}:${AGENT_PORT}/query" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"topK\": 5}" 2>/dev/null || echo "{\"error\": \"Agent unreachable at ${AGENT_HOST}:${AGENT_PORT}\"}")
  
  echo "$response"
}

# Function: Format context for Copilot
format_context() {
  local query="$1"
  local response="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  cat > "$CONTEXT_FILE" <<EOF
# llm-memory Context for Copilot

**Generated:** $timestamp
**Query:** $query

## Agent Response

\`\`\`json
$response
\`\`\`

## How to Use

1. Reference this context in Copilot chat:
   - "Based on the context in .vscode/copilot-context.md, ..."
   - "Following our policies from llm-memory, ..."

2. Copy specific policies/answers from above into your prompt

3. Generate new context: \`./scripts/copilot-context.sh "your question"\`

---

**Note:** This context is auto-generated and expires after 1 hour.
Refresh by running the script again.
EOF
}

# Function: Check Agent health
check_health() {
  echo -e "${BLUE}📊 Checking Agent health...${NC}"
  
  health=$(curl -s -X GET "http://${AGENT_HOST}:${AGENT_PORT}/health" 2>/dev/null || echo "{\"status\": \"unreachable\"}")
  
  status=$(echo "$health" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
  postgres=$(echo "$health" | jq -r '.postgres // "unknown"' 2>/dev/null || echo "unknown")
  ollama=$(echo "$health" | jq -r '.ollama // "unknown"' 2>/dev/null || echo "unknown")
  
  if [ "$status" = "ok" ]; then
    echo -e "${GREEN}✓ Agent: $status${NC}"
    echo -e "${GREEN}✓ Postgres: $postgres${NC}"
    echo -e "${GREEN}✓ Ollama: $ollama${NC}"
    return 0
  else
    echo -e "${RED}✗ Agent unreachable or unhealthy${NC}"
    echo -e "${RED}Status: $status${NC}"
    echo -e "${YELLOW}Tip: Check if Agent Service is running:${NC}"
    echo -e "${YELLOW}  docker-compose logs agent${NC}"
    return 1
  fi
}

# Function: Display usage
show_help() {
  cat <<EOF
${BLUE}llm-memory Copilot Context Generator${NC}

${BLUE}Usage:${NC}
  ./scripts/copilot-context.sh <query>
  ./scripts/copilot-context.sh --health
  ./scripts/copilot-context.sh --help

${BLUE}Examples:${NC}
  ./scripts/copilot-context.sh "What's our naming convention?"
  ./scripts/copilot-context.sh "error handling patterns"
  ./scripts/copilot-context.sh --health

${BLUE}Environment Variables:${NC}
  AGENT_HOST    Agent service hostname (default: localhost)
  AGENT_PORT    Agent service port (default: 3000)

${BLUE}Output:${NC}
  Context saved to: .vscode/copilot-context.md
  Query logged to: .vscode/copilot-queries.log

${BLUE}Workflow:${NC}
  1. Run: ./scripts/copilot-context.sh "your question"
  2. Check: .vscode/copilot-context.md
  3. Use in Copilot: Copy answers into chat
  4. Reference: "Based on the context I just generated, ..."

EOF
}

# Main logic
main() {
  if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Query required${NC}"
    show_help
    exit 1
  fi
  
  case "$1" in
    --help|-h)
      show_help
      exit 0
      ;;
    --health)
      check_health
      exit $?
      ;;
    *)
      local query="$1"
      
      # Check health first
      if ! check_health; then
        echo -e "${YELLOW}⚠️  Agent is unreachable. Context may be stale.${NC}"
        echo -e "${YELLOW}   Continuing anyway...${NC}"
      fi
      
      echo ""
      
      # Query agent
      response=$(query_agent "$query")
      
      # Check for errors
      if echo "$response" | grep -q '"error"'; then
        echo -e "${RED}✗ Query failed${NC}"
        echo "$response"
        exit 1
      fi
      
      # Format and save context
      format_context "$query" "$response"
      
      # Log query
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Query: $query" >> "$QUERIES_LOG"
      
      # Display result
      echo -e "${GREEN}✓ Context generated${NC}"
      echo -e "${GREEN}✓ Saved to: $CONTEXT_FILE${NC}"
      echo ""
      echo -e "${BLUE}Answer:${NC}"
      echo "$response" | jq '.answer // .' 2>/dev/null || echo "$response"
      echo ""
      echo -e "${BLUE}Sources:${NC}"
      echo "$response" | jq '.sources[]? // empty' 2>/dev/null || echo "None"
      echo ""
      echo -e "${YELLOW}Next step:${NC}"
      echo -e "${YELLOW}1. Open .vscode/copilot-context.md${NC}"
      echo -e "${YELLOW}2. Copy relevant context${NC}"
      echo -e "${YELLOW}3. Paste into Copilot chat${NC}"
      ;;
  esac
}

# Run main
main "$@"
