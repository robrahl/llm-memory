# llm-memory PRD

**PRD — Product Requirements Document**

Zweck: Dokumentiert das vorläufige Design, Ziele, Annahmen und die Abnahmekriterien für die Implementierung eines Developer‑AI‑Systems mit persistentem Memory (Postgres + pgvector) und TypeScript‑Agenten, lokal betrieben auf Synology DSM7 via Docker.


## 1. Projektübersicht


- **Projektname:** `llm-memory` — Developer AI Agent with Persistent Memory

- **Beschreibung:** Entwicklertool/Agent für Solo-Entwickler, das Programmier‑ und Architekturvorgaben persistent hält, Entwicklerfragen beantwortet, ADRs und Architekturentscheidungen als Knowledge Base fortschreibt und lokal auf einer Synology NAS betrieben wird.

- **Nutzermodell:** Single Developer (1 User, solo private use). Zugriff nur lokal via Synology NAS. RTX 3090 eGPU mit Lenovo Laptop als Embedding/LLM Engine.

- **Hauptziele:** 

  1. Agent vergisst keine Architektur‑/Coding‑Vorgaben (persistente Regeln).

  2. Aufbau einer wachsenden Knowledge‑Base (ADRs, Docs, Code‑Snippets) mit Embedding‑Retrieval.

  3. Lokaler Betrieb mit Datensicherheit, Backups und einfacher Wartbarkeit.


## 2. Anwendungsfälle (Use Cases)


1. **Policy‑Enforcement:** Agent prüft Pull Requests / Vorschläge auf Einhaltung der Architekturregeln.

2. **Contextual Assistant:** Entwickler fragt nach Projekt-Kontext, Naming, Patterns.

3. **Knowledge Growth:** Agent indexiert neue ADRs, Commit‑Messages oder Meeting‑Notes und speichert sie in der Wissensdatenbank.

4. **Code‑Snippets und Patterns:** Schnelles Auffinden von Code‑Beispielen und Refactor‑Hinweisen.


## 3. Hauptanforderungen

### Funktional


- Persistente Global‑Rules (projektübergreifend).

- Project‑Specific Memory (kontextspezifisch pro Projekt).

- Embedding‑basierte Suche (pgvector in Postgres).

- API für Query/Update (REST/GraphQL).

- Optional: Web‑UI für Chat + Admin (OpenWebUI / einfache React‑UI).


### Nicht‑funktional


- Lokal auf Synology DSM7 Docker lauffähig.

- Backup/Restore von Postgres (automatisierbar).

- Zugriffskontrolle: API‑Keys / lokale Auth.

- Performance: akzeptable Retrieval‑Latenz (< 200ms für 1k Einträge auf NAS, abhängig Hardware).

- Datenschutz: keine externe Übertragung sensibler Daten (konfigurierbar).


## 4. Annahmen


- Synology NAS hat ausreichend CPU/RAM/Storage für Docker‑Container (Postgres, Agent Service).

- Postgres mit pgvector ist auf NAS lauffähig.

- Entwickler verwenden TypeScript / Node.js für Agent‑Logik.

- **Local LLM:** Ollama läuft auf eGPU-connected Laptop (RTX 3090). Embedding & LLM inference lokal, keine Cloud-API Kosten.

- Agent kommuniziert via HTTP mit Ollama auf Laptop (intra-LAN, keine Internet-Abhängigkeit).

- Synology NAS + Laptop sind im gleichen Netzwerk.


## 5. Architektur‑Highlights (kurz)


- **Agent‑Service** (Node.js / TypeScript) auf Synology NAS

- **Postgres + pgvector** auf Synology NAS als Vektor‑Store + Relational Store

- **Indexer** (CLI, auf NAS) — Dokumente indexieren, Ollama für Embeddings nutzen

- **Ollama** läuft auf eGPU-Laptop (RTX 3090) — Local LLM (z.B. Mistral, Llama2 7B) + Embeddings

- **Docker Compose** auf NAS (Postgres + Agent Service)

- **Simpel:** Kein Redis/Queue für V0 (single user = kein Concurrency-Stress)


## 6. Akzeptanzkriterien


- **Policy Persistence:** Agent lädt bei Start die Global Rules automatisch. Policies lassen sich nicht via Prompt überschreiben; nur via CLI-Befehl `agent-cli policy-update`.

- **Knowledge Base Extension:** CLI-Befehl `agent-cli index-docs --path ./docs/` indexiert Markdown-Dateien und speichert Embeddings in Postgres.

- **Retrieval Quality:** Bei 10 Testfragen liefert Agent semantisch passende Antworten mit Quellenangabe (Document ID + Excerpt).

- **Backup & Restore:** `./scripts/backup.sh` erstellt Postgres-Dump. `./scripts/restore.sh` stellt Datenbank wiederher (< 5 min auf NAS).

- **Offline Capability:** Agent arbeitet ohne Internet. Bei Ollama-Ausfall: Agent meldet klare Fehlermeldung (nicht abstrakt).

- **Performance (Single User):** Query-Latenz < 500ms (Embedding + Retrieval + LLM Response auf lokaler Hardware).


## 7. Risiken & Gegenmaßnahmen


- **Risk:** Synology Hardware limitiert Modelle/Performance. 

  - **Mitigation:** Nutze remote LLMs oder schlanke lokale Modelle; scale down Embedding‑Batching.


- **Risk:** Datenverlust. 

  - **Mitigation:** Tägliche DB‑Dumps, regelmäßige Volumen‑Snapshots.


- **Risk:** Inkonsistente Memory‑Updates (Race Conditions). 

  - **Mitigation:** Transaktionale Writes, Queue (e.g., BullMQ) für Indexer‑Jobs.


## 8. Testplan

### Simple Validation Suite (Minimal für V0)

**Unit Tests** (für Developer / CI-Pipeline):
- Policy CRUD: `test_policy_create`, `test_policy_load_on_startup`, `test_policy_immutable_without_cli`
- Embedding Retrieval: `test_retrieve_by_similarity`, `test_chunking_consistency`

**Integration Tests** (Indexer → Retrieval):
- Load 5 sample ADR docs → Index with Ollama → Query → Verify results have doc refs

**E2E Manual Smoke Test** (Developer runs once before ship):
1. Start Agent + Postgres on NAS
2. Load 3 test policies via CLI
3. Ask Agent: "What's our naming convention?" → Must cite policy
4. Change policy, restart Agent, ask same question → Must return updated answer
5. Stop Ollama, query again → Agent returns: "LLM unavailable, offline mode. Last known answer: [cached]"

**Performance Baseline** (Single user, not load-test):
- Measure: Embedding generation (doc) + Retrieval (1k docs) + LLM response latency
- Log to `metrics.json` after each query
- Alert if latency > 500ms (indicates LLM/Ollama lag)

### Simple Metrics (Observability)

**Log File:** `agent.log` (JSON lines)
```json
{"timestamp": "2025-11-16T10:30:00Z", "event": "query", "query_hash": "abc123", "retrieval_ms": 120, "llm_ms": 180, "total_ms": 300, "docs_found": 3, "policy_enforced": true}
{"timestamp": "2025-11-16T10:31:00Z", "event": "index", "docs_added": 2, "embedding_ms": 450}
{"timestamp": "2025-11-16T10:32:00Z", "event": "policy_updated", "policy_key": "naming_convention", "user": "cli"}
```

**Health Check Endpoint:** `GET /health`
```json
{"status": "ok", "postgres": "connected", "ollama": "reachable", "policies_loaded": 5, "docs_in_kb": 12}
```

**Manual Metrics Review (Weekly):**
- Count queries per day (adoption)
- Average latency trend
- Policy enforcement hits (how often policies prevent mistakes)
- Failed queries (Ollama down, bad retrieval)

No Prometheus/Grafana for V0 (cost + complexity). Metrics stay in JSON, developer reviews manually or runs simple aggregation script.


## 9. Meilensteine & Deliverables

### V0 — Functional Private System (2 Wochen)
**Goal:** Agent answers questions. Policies persist. Works offline.

1. **Postgres Setup:** pgvector extension, 3 core tables (policies, documents, project_context), seeded with 3 sample policies
2. **Agent Service MVP:** Loads policies on startup, responds to queries via `/query` endpoint, logs metrics to `agent.log`
3. **CLI Tools:**
   - `agent-cli load-policy --file policy.md`
   - `agent-cli index-docs --path ./docs/`
   - `agent-cli query "How do I name services?"`
4. **Ollama Integration:** Agent calls Ollama (laptop) for embeddings & LLM. Graceful fail if Ollama down.
5. **Backup/Restore:** Shell scripts `backup.sh` and `restore.sh`
6. **Documentation:** Quick Start (5 min), Architecture Diagram (1 page), ADR Template
7. **Simple Tests:** 5 unit tests, 2 integration tests, 1 E2E smoke test

### V1 — Knowledge Growth & Polish (4 Wochen)
**Goal:** Indexer stable. Policy versioning. Metrics dashboard simple.

1. **Indexer Robustness:** Idempotent indexing, error handling for malformed docs, progress logging
2. **Policy Versioning:** `policy_versions` table tracks changes with timestamps, `agent-cli policy-history` shows audit trail
3. **Query Improvements:** Return source document excerpts, confidence scores
4. **Health Dashboard (Simple HTML):** Single-page stats (policies count, docs count, last query time, Ollama status)
5. **Automated Backup:** Daily cron job on NAS
6. **More Tests:** 15 unit + 5 integration tests, E2E for policy versioning

### V2 — Optional Enhancements (Later)
Web UI, remote Ollama options, multi-project support, etc. (Only if V0+V1 prove valuable.)

**For Private Single-User Use:** V0 + V1 = Done. V2 can wait indefinitely.


## 10. Verantwortlichkeiten


- **You (Solo Dev):** Alles — Systementwurf, Implementierung, Tests, Deployment, Backups.

**Empfehlung:** Arbeite iterativ:
- Woche 1–2: Setup + Core Agent (V0 Phase 1)
- Woche 2–3: Indexer + CLI (V0 Phase 2)
- Woche 3–4: Tests + Docs + Deploy (V0 Phase 3)
- Nach 1–2 Wochen Nutzung: V0 Retrospektiv → entscheiden, ob V1 nötig


## 11. Entscheidungen (Festgelegt für V0)


- ✅ **Local LLM:** Ollama + RTX 3090 eGPU (cost-free, offline)
- ✅ **Embedding Model:** `all-MiniLM-L6-v2` via Ollama (light, fast, 384-dim vectors)
- ✅ **LLM Model:** Mistral 7B or Llama2 7B (fits RTX 3090, reasonable latency)
- ✅ **UI für V0:** CLI only (simplest, fastest to ship)
- ✅ **Database:** Postgres on NAS (persistent, pgvector support)
- ✅ **Architecture:** No message queue, no cache layer (single user = simple)
- ❌ **CI Hooks:** Out of scope V0. Manual indexing via CLI.
- ❌ **Multi-project:** Out of scope V0. Single "default" project.
- ❌ **Remote Ollama/Cloud API:** Not planned (local + offline = requirement)

---

## 12. Cost Breakdown (Private Use)

| Component | Cost | Notes |
|-----------|------|-------|
| Synology NAS | Already owned | ~500–2000 EUR initial |
| RTX 3090 | Already owned | eGPU can be repurposed later |
| Docker licenses | Free | Open source |
| Postgres | Free | Open source, pgvector extension free |
| Ollama | Free | Open source, runs locally |
| Node.js / TypeScript | Free | Open source |
| **Total V0+V1** | **0 EUR** | Only electricity (NAS + eGPU). No subscription. |

---

## 13. Success Metrics für Private Use

| Metrik | V0 Ziel | Wie Gemessen |
|--------|---------|---------------|
| Agent antwortet auf Fragen | 100% (5/5 Testfragen) | Manual E2E test |
| Policies bleiben persistent | 100% (nach Restart) | Manual restart + query |
| Query-Latenz | < 500ms | Log analysis (`agent.log`) |
| Backup restore funktioniert | 100% (restore.sh) | Manual backup/restore test |
| Offline bei Ollama-Ausfall | Graceful fail (keine Crashes) | Manual Ollama shutdown test |
| Developer adoptiert Tool | Minimum 2 queries/day | Metric logging nach 1 Woche |

**V0 Success Criteria:** ✅ Alle 6 Metriken grün = ready for personal daily use.

### Post-Launch Retrospective (Week 1–2 of daily use)

**Critical Decision Point:**

After **1 week of daily use**, answer this question in writing:

> **"What was the Agent's most valuable answer this week?"**

If you can answer this clearly (e.g., "Agent reminded me our naming convention saves 30 min of code review debate"), then **V1 is justified**.

If you can't answer it (e.g., "I just used it for random questions"), then **V1 is a pivot**: either
- Focus on a specific use case (e.g., Policy Enforcement for PRs only)
- Or stop; the tool solved what it needed to solve

This keeps the project lean and intent-driven.

---

## 14. Implementation Details (Non-Overengineered)

### Policy Schema (YAML Format)

Simple, strict format. Example:

```yaml
policies:
  - key: "naming_convention"
    value:
      rule: "All microservices named {SomethingService}"
      examples: ["AuthService", "PaymentService"]
    description: "Consistent service naming"
```

Validation: Must have `key`, `value`, `description`. Reject malformed with clear error.

---

### Offline Mode + Query Caching

When Ollama timeout > 5s:
1. Check `query_cache` for similar recent queries
2. Return cached response with metadata:
```json
{
  "answer": "Services should be named {ServiceName}Service...",
  "cached": true,
  "age_seconds": 3600,
  "warning": "LLM unavailable. Response from cache, 1h old."
}
```
3. Log: `{"event": "cache_hit", "reason": "ollama_timeout"}`

Cache TTL: 7 days.

---

### CLI Error Messages (Developer-Friendly)

Bad: `Error: Invalid query`

Good: `Error: Query too long (2800 chars). Max: 2000. Tip: Break into 2 queries or use index-docs first.`

All errors include: (1) What failed, (2) Why, (3) How to fix.

---

### Regression Test (Pre-Deployment)

Before deployment, run `./scripts/test-policy-persistence.sh` (1 min):

```bash
agent-cli load-policy --file ./test-fixtures/naming_convention.md
docker-compose restart agent
RESPONSE=$(agent-cli query "naming convention?")
if echo "$RESPONSE" | grep -q "SomethingService"; then
  echo "✓ Policy persisted"
else
  echo "✗ FAIL: Policy lost"
  exit 1
fi
```

Catches critical failures every deployment.

---

### CLI Output Formatting

**V0 (JSON only):**
```json
{"answer": "...", "sources": [{"id": "policy-001"}], "latency_ms": 320}
```

**V1+ (if adopted):** Pretty-print with metadata. Ship V0 minimal, upgrade if needed.

---

## 15. Copilot Integration Roadmap

### V0 — Manual Context via Shell Script (Ready Now)

**How it works:**
```bash
./scripts/copilot-context.sh "What's our naming convention?"
```
Generates `.vscode/copilot-context.md` with Agent response.

**Workflow:**
1. Run script before coding session
2. Reference context in Copilot Chat: "Based on .vscode/copilot-context.md, ..."
3. Copilot generates code aligned with your policies

**Time to ship:** Ready immediately (Day 1)
**Implementation:** `scripts/copilot-context.sh` (bash script, 150 lines)
**Setup:** `chmod +x scripts/copilot-context.sh`

**Limitations:**
- Manual (you run the script)
- No auto-sync with Copilot
- Context expires after 1 hour

**Docs:** See `docs/copilot-v0-integration.md`

---

### V1 — Direct MCP Integration (Post-V0)

**How it works:**
Copilot calls llm-memory tools directly via MCP:
```
@llm-memory query_knowledge_base "naming convention"
@llm-memory check_policy_compliance code_snippet: "..."
```

**Tools provided:**
- `query_knowledge_base` — Search KB by topic
- `check_policy_compliance` — Validate code against policies
- `load_policy` — Update policies
- `get_health_status` — System status

**Time to ship:** 2-3 days (post-V0)
**Implementation:** `src/mcp-server.ts` (TypeScript, ~300 lines)
**Setup:** 
```bash
npm install @modelcontextprotocol/sdk zod
npm run build:mcp
# Configure ~/.vscode/mcp-servers.json
```

**Benefits:**
- Zero manual copy-paste
- Direct tool calls from Copilot
- Automatic context injection
- System health monitoring

**Docs:** See `docs/copilot-v1-mcp.md`

---

## 16. Technologie Decisions (Cost-Effective Single User)

### LLM + Embedding Stack
- **Ollama** (free, local) statt paid API (OpenAI, Hugging Face) → **Cost: 0 EUR/month**
- **Mistral 7B or Llama2 7B** (7B params fits RTX 3090 comfortably, 8–16 TFLOPS inference) → **Cost: 0 EUR**
- **all-MiniLM-L6-v2** (384-dim embedding, super fast) statt large models → **Cost: 0 EUR + better retrieval speed**

### Infrastructure
- **Postgres on NAS** (existing hardware) statt managed cloud DB (RDS, Firestore) → **Cost: 0 EUR/month**
- **No message queue (V0)** statt BullMQ/Redis → **Cost: 0 EUR + simpler code**
- **No monitoring stack** (Prometheus/Grafana) statt commercial APM → **Cost: 0 EUR + JSON logs sufficient**

### Development
- **TypeScript/Node.js** (free ecosystem)
- **Docker Compose** (free orchestration, perfect for single developer)

**Total Cost of Ownership:** < 100 EUR/year electricity. No license fees.