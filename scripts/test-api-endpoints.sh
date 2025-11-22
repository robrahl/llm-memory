#!/bin/bash
# Test script for the new search and ingest endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== llm-memory API Endpoint Tests ==="
echo ""

BASE_URL="${1:-http://localhost:3000}"

echo "Testing against: $BASE_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 2: Query endpoint
echo -e "${YELLOW}Test 2: Query endpoint (existing)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"naming convention","topK":2}')
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Query endpoint works${NC}"
    echo "$body" | jq '.answer, .sources' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Query endpoint failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 3: Ingest a test document
echo -e "${YELLOW}Test 3: Ingest endpoint${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "docKey": "test-doc-001",
    "content": "This is a test document about microservices architecture and error handling patterns. It describes best practices for building resilient distributed systems.",
    "metadata": {"type": "test", "category": "architecture"}
  }')
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Ingest endpoint works${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Ingest endpoint failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 4: Search endpoint (text search - no embeddings required)
echo -e "${YELLOW}Test 4: Search endpoint (text search fallback)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","topK":3,"useSemanticSearch":false}')
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Search endpoint works (text search)${NC}"
    echo "$body" | jq '.query, .count, .search_type' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Search endpoint failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 5: Search endpoint (semantic search - will gracefully fall back if LLM unavailable)
echo -e "${YELLOW}Test 5: Search endpoint (semantic search)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"microservices architecture","topK":5}')
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Search endpoint works (semantic search)${NC}"
    echo "$body" | jq '.query, .count, .search_type, .latency_ms' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Search endpoint failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 6: Invalid request handling
echo -e "${YELLOW}Test 6: Error handling (missing required field)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -d '{"topK":5}')
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "400" ]; then
    echo -e "${GREEN}✓ Proper error handling (HTTP 400)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Expected HTTP 400, got $http_code${NC}"
    echo "$body"
fi
echo ""

# Test 7: V2 Metrics endpoint
echo -e "${YELLOW}Test 7: Metrics endpoint (V2)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/metrics")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Metrics endpoint works${NC}"
    echo "$body" | jq '.storage, .system' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Metrics endpoint failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 8: V2 ADR generation
echo -e "${YELLOW}Test 8: ADR Generation endpoint (V2)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/adr/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test ADR",
    "context": "We need to test ADR generation functionality",
    "decision": "Create a test ADR through the API",
    "status": "proposed"
  }')
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ ADR generation works${NC}"
    echo "$body" | jq '.number, .title, .status' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ ADR generation failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 9: V2 Compliance scan
echo -e "${YELLOW}Test 9: Compliance Scan endpoint (V2)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/scan/compliance" \
  -H "Content-Type: application/json" \
  -d '{
    "directory": "./src",
    "recursive": true
  }')
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Compliance scan endpoint works${NC}"
    echo "$body" | jq '.summary' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Compliance scan failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 10: V2 Refactor suggestions
echo -e "${YELLOW}Test 10: Refactor Suggestions endpoint (V2)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/refactor/suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "code_snippet": "function test() { var x = 1; return x + 2; }",
    "context": "javascript",
    "focus_areas": ["readability", "modern-syntax"]
  }')
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Refactor suggestions endpoint works${NC}"
    echo "$body" | jq '.success, .suggestions | length' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Refactor suggestions failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo "=== Test Summary ==="
echo "All endpoint tests completed. Review results above."
echo ""
echo "V1 Endpoints: /health, /query, /search, /ingest"
echo "V2 Endpoints: /metrics, /adr/generate, /scan/compliance, /refactor/suggest"
echo ""
echo "Note: Semantic search may fall back to text search if LLM service is unavailable."
echo "This is expected behavior for offline/degraded mode."
