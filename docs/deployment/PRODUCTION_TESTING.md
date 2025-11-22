# Production Deployment Testing Guide

This guide covers testing the llm-memory production deployment using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- At least 2GB RAM available
- Ports 3000 and 5433 available

## Quick Start

### 1. Build and Start Services

```bash
# Clone the repository
git clone https://github.com/robrahl/llm-memory.git
cd llm-memory

# Create .env file (optional - uses defaults if not provided)
cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=changeme
LLM_BASE_URL=http://host.docker.internal:11434
LLM_PROVIDER=ollama
LLM_MODEL=mistral:7b
NODE_ENV=production
LOG_LEVEL=info
EOF

# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps
```

Expected output:
```
NAME                    IMAGE                   STATUS         PORTS
llm-memory-agent        llm-memory-agent        Up 1 minute    0.0.0.0:3000->3000/tcp
llm-memory-postgres     pgvector/pgvector:pg16  Up 1 minute    0.0.0.0:5433->5432/tcp
```

### 2. Verify Health

```bash
# Check agent health
curl http://localhost:3000/health | jq

# Expected response:
# {
#   "status": "ok",
#   "postgres": "connected",
#   "ollama": "reachable" or "unreachable"
# }
```

### 3. Run API Tests

```bash
# Run the test script
./scripts/test-api-endpoints.sh http://localhost:3000
```

This will test:
- ✓ Health check
- ✓ Query endpoint
- ✓ Ingest endpoint
- ✓ Search endpoint (text and semantic)
- ✓ Error handling
- ✓ V2 Metrics endpoint
- ✓ V2 ADR generation
- ✓ V2 Compliance scan
- ✓ V2 Refactor suggestions

### 4. Test Web UI

```bash
# Open in browser
open http://localhost:3000/ui

# Or with curl
curl http://localhost:3000/ui
```

Web UI should load with:
- Home tab (welcome screen)
- Policies tab (list/create policies)
- Search Tester tab (semantic search)

## Detailed Testing

### Database Testing

```bash
# Connect to PostgreSQL
docker exec -it llm-memory-postgres psql -U postgres -d ai_memory

# Check tables exist
\dt

# Expected tables:
# - architectural_policies
# - documents
# - project_context
# - query_cache
# - policy_versions

# Check sample policies
SELECT key, description FROM architectural_policies;

# Exit psql
\q
```

### Test Document Ingestion

```bash
# Ingest a test document
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "docKey": "test-policy",
    "content": "Test policy for deployment verification. All services must have health checks.",
    "metadata": {"type": "policy", "status": "test"}
  }' | jq

# Search for the document
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "health checks",
    "topK": 5,
    "useSemanticSearch": false
  }' | jq
```

### Test Policy Management

```bash
# Create a policy
curl -X POST http://localhost:3000/policy \
  -H "Content-Type: application/json" \
  -d '{
    "key": "deployment_policy",
    "value": {"rule": "All services must use health checks"},
    "description": "Deployment health check requirement"
  }' | jq

# List all policies
curl http://localhost:3000/policies | jq

# Get specific policy
curl http://localhost:3000/policies/deployment_policy | jq
```

### Test Query with LLM

```bash
# Query the knowledge base
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are our deployment requirements?",
    "topK": 3
  }' | jq

# Note: Requires LLM service running (Ollama/LMStudio/OpenAI)
```

### Test V2 Endpoints

#### Test Metrics
```bash
curl http://localhost:3000/metrics | jq
```

#### Test ADR Generation
```bash
curl -X POST http://localhost:3000/adr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Use Docker Compose for deployment",
    "context": "Need reproducible deployment across environments",
    "decision": "Adopt Docker Compose for service orchestration",
    "consequences": "Simplified deployment, consistent environments",
    "status": "accepted"
  }' | jq
```

#### Test Compliance Scan
```bash
curl -X POST http://localhost:3000/scan/compliance \
  -H "Content-Type: application/json" \
  -d '{
    "directory": "./src",
    "recursive": true
  }' | jq
```

#### Test Refactoring Suggestions
```bash
curl -X POST http://localhost:3000/refactor/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "code_snippet": "function test() { var x = 1; return x + 2; }",
    "context": "javascript"
  }' | jq

# Note: Requires LLM service running
```

## Performance Testing

### Load Test with ab (Apache Bench)

```bash
# Install ab if not available
# Ubuntu/Debian: apt-get install apache2-utils
# macOS: pre-installed

# Test health endpoint
ab -n 1000 -c 10 http://localhost:3000/health

# Test search endpoint
ab -n 100 -c 5 -p search.json -T application/json http://localhost:3000/search

# Create search.json first:
echo '{"query":"test","topK":5,"useSemanticSearch":false}' > search.json
```

Expected performance:
- Health endpoint: > 500 req/sec
- Search endpoint: > 50 req/sec (without LLM)
- Query endpoint: 5-20 req/sec (with LLM)

### Monitor Resource Usage

```bash
# Monitor container stats
docker stats llm-memory-agent llm-memory-postgres

# Expected resource usage:
# Agent: < 200MB RAM, < 10% CPU (idle)
# Postgres: < 100MB RAM, < 5% CPU (idle)
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs -f

# Common issues:
# 1. Port 3000 already in use
docker-compose down
lsof -i :3000
kill <PID>

# 2. Port 5433 already in use
lsof -i :5433
kill <PID>

# 3. Database connection issues
docker-compose logs postgres
```

### Agent Can't Connect to Database

```bash
# Check postgres is healthy
docker-compose ps postgres

# Check database exists
docker exec -it llm-memory-postgres psql -U postgres -l

# Restart services
docker-compose restart
```

### LLM Service Unreachable

```bash
# Check LLM_BASE_URL is correct
echo $LLM_BASE_URL

# Test LLM service directly
# For Ollama:
curl http://localhost:11434/api/tags

# For OpenAI-compatible:
curl http://localhost:11434/v1/models

# Update .env if needed
docker-compose down
# Edit .env
docker-compose up -d
```

### Web UI Not Loading

```bash
# Check UI was built
docker exec llm-memory-agent ls -la dist/ui

# If empty, rebuild
docker-compose down
docker-compose build --no-cache agent
docker-compose up -d

# Check logs
docker-compose logs agent | grep -i error
```

### Semantic Search Not Working

```bash
# Check embeddings are being generated
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"content":"test"}' | jq '.has_embedding'

# Should return: true

# If false, check LLM service
curl http://localhost:3000/health | jq '.ollama'

# Fallback: Use text search
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","useSemanticSearch":false}' | jq
```

## Production Checklist

### Before Deployment

- [ ] Review and update `.env` file
- [ ] Change default database password
- [ ] Configure LLM service URL
- [ ] Review resource limits in docker-compose.yml
- [ ] Set up log rotation
- [ ] Configure backup strategy

### Deployment Steps

- [ ] Build images: `docker-compose build`
- [ ] Start services: `docker-compose up -d`
- [ ] Verify health: `curl http://localhost:3000/health`
- [ ] Run API tests: `./scripts/test-api-endpoints.sh`
- [ ] Test Web UI: Open http://localhost:3000/ui
- [ ] Import initial documents: `npm run import -- ./docs`
- [ ] Create initial policies via UI or API

### Post-Deployment

- [ ] Monitor logs: `docker-compose logs -f`
- [ ] Check resource usage: `docker stats`
- [ ] Set up monitoring/alerting
- [ ] Document deployment configuration
- [ ] Test backup and restore procedures
- [ ] Configure automatic restarts

## Monitoring

### Check Service Health

```bash
# Health check endpoint
curl http://localhost:3000/health

# System metrics
curl http://localhost:3000/metrics | jq

# Docker health status
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f agent
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 agent
```

### Database Statistics

```bash
# Connect to database
docker exec -it llm-memory-postgres psql -U postgres -d ai_memory

# Check document count
SELECT COUNT(*) FROM documents;

# Check policy count
SELECT COUNT(*) FROM architectural_policies;

# Check database size
SELECT pg_size_pretty(pg_database_size('ai_memory'));

# Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'documents';
```

## Backup and Restore

### Backup Database

```bash
# Create backup directory
mkdir -p backups

# Backup database
docker exec llm-memory-postgres pg_dump -U postgres ai_memory > backups/ai_memory_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker exec llm-memory-postgres pg_dump -U postgres ai_memory | gzip > backups/ai_memory_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# Stop agent service
docker-compose stop agent

# Restore from backup
cat backups/ai_memory_20250122_120000.sql | docker exec -i llm-memory-postgres psql -U postgres ai_memory

# Or with compression
gunzip -c backups/ai_memory_20250122_120000.sql.gz | docker exec -i llm-memory-postgres psql -U postgres ai_memory

# Restart agent
docker-compose start agent
```

## Scaling Considerations

### Horizontal Scaling

The current setup is single-instance. For multi-instance deployment:

1. Use external PostgreSQL (managed service)
2. Configure load balancer
3. Share LLM service across instances
4. Consider Redis for caching
5. Use container orchestration (Kubernetes)

### Vertical Scaling

Adjust resources in docker-compose.yml:

```yaml
services:
  agent:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 512M
```

### Database Optimization

See performance tuning in `scripts/init-pgvector.sql`:
- Adjust vector index parameters
- Configure PostgreSQL settings
- Add query-specific indexes
- Monitor and optimize slow queries

## Security Best Practices

### Production Security

1. **Change Default Passwords**
   ```bash
   # Generate strong password
   openssl rand -base64 32
   
   # Update .env
   DB_PASSWORD=<strong-password>
   ```

2. **Use Docker Secrets** (for Swarm/production)
   ```yaml
   secrets:
     db_password:
       external: true
   ```

3. **Restrict Network Access**
   - Use internal networks for inter-service communication
   - Expose only necessary ports
   - Configure firewall rules

4. **Enable TLS/SSL**
   - Use reverse proxy (nginx, traefik)
   - Configure SSL certificates
   - Force HTTPS

5. **Regular Updates**
   - Keep Docker images updated
   - Monitor security advisories
   - Apply patches promptly

## Next Steps

After successful deployment:

1. **Import Documentation**
   ```bash
   npm run import -- ./docs --recursive
   ```

2. **Configure MCP Server**
   - Update VS Code settings
   - Test Copilot integration
   - See [MCP V2 Tools User Guide](../copilot/v2-tools-user-guide.md)

3. **Create Initial Policies**
   - Use Web UI to create policies
   - Or import via API
   - Document team decisions as ADRs

4. **Set Up Monitoring**
   - Configure alerting
   - Monitor system metrics
   - Track query performance

## See Also

- [Local Deployment Guide](../deployment/local/README.md)
- [NAS Deployment Guide](../deployment/nas/README.md)
- [API Reference](../reference/api-reference.md)
- [Architecture Guide](../reference/architecture.md)
