#!/usr/bin/env node

/**
 * llm-memory MCP Server V2.0
 * 
 * Implements the Model Context Protocol (MCP) to expose llm-memory tools to VS Code Copilot.
 * 
 * Usage:
 *   node dist/mcp-server.js
 * 
 * Configuration (VS Code):
 *   ~/.vscode/mcp-servers.json:
 *   {
 *     "mcpServers": {
 *       "llm-memory": {
 *         "command": "node",
 *         "args": ["/path/to/llm-memory/dist/mcp-server.js"]
 *       }
 *     }
 *   }
 * 
 * V1 Tools:
 *   - query_knowledge_base
 *   - check_policy_compliance
 *   - load_policy
 *   - get_health_status
 * 
 * V2.0 Tools:
 *   - policy_compliance_report (auto-scan codebase)
 *   - suggest_refactoring (AI-powered improvements)
 *   - generate_adr (template-based ADR creation)
 *   - get_metrics (real-time system metrics)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration
const AGENT_HOST = process.env.AGENT_HOST || "localhost";
const AGENT_PORT = process.env.AGENT_PORT || "3000";
const AGENT_URL = `http://${AGENT_HOST}:${AGENT_PORT}`;

// Create MCP server
const server = new McpServer(
  {
    name: "llm-memory",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// V1 Tools
server.tool(
  "query_knowledge_base",
  "Search llm-memory knowledge base for architectural decisions, patterns, and guidelines. Returns relevant documents with source citations.",
  {
    query: z.string().describe("Search query for knowledge base"),
    project_key: z.string().optional().describe("Project context (optional)"),
    top_k: z.number().optional().default(5).describe("Number of results to return"),
  },
  async ({ query, project_key, top_k }) => {
    try {
      const response = await fetch(`${AGENT_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          project_key: project_key || "default",
          topK: top_k,
        }),
      });

      if (!response.ok) {
        const error = `Agent returned ${response.status}`;
        const details = await response.text();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error, details }, null, 2),
            },
          ],
        };
      }

      const result = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                answer: result.answer,
                sources: result.sources,
                latency_ms: result.latency_ms,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Failed to query knowledge base",
                details: error instanceof Error ? error.message : String(error),
                tip: `Check if Agent is running at ${AGENT_URL}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.tool(
  "check_policy_compliance",
  "Check if code/design follows established architectural policies. Returns compliance report with suggestions.",
  {
    code_snippet: z.string().describe("Code or design to check"),
    policy_key: z.string().optional().describe("Specific policy to check against (optional)"),
  },
  async ({ code_snippet }) => {
    try {
      const response = await fetch(`${AGENT_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Check if this code follows our policies:\n\n${code_snippet}`,
          project_key: "default",
          topK: 3,
        }),
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `Agent returned ${response.status}` }, null, 2),
            },
          ],
        };
      }

      const result = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                compliance_feedback: result.answer,
                relevant_policies: result.sources,
                suggested_changes: result.suggestions || [],
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Failed to check policy compliance",
                details: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.tool(
  "load_policy",
  "Load or update an architectural policy in the knowledge base. Requires authentication.",
  {
    policy_file: z.string().describe("Path to policy file to load"),
    overwrite: z.boolean().optional().default(false).describe("Overwrite existing policy"),
  },
  async ({ policy_file, overwrite }) => {
    try {
      const response = await fetch(`${AGENT_URL}/policy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_file,
          overwrite,
        }),
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: `Failed to load policy (${response.status})`,
                  details: await response.text(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const result = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Policy loaded successfully`,
                policy_key: result.policy_key,
                version: result.version,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Failed to load policy",
                details: error instanceof Error ? error.message : String(error),
                tip: "Ensure policy file exists and Agent is running",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.tool(
  "get_health_status",
  "Check health of llm-memory system: Agent service, Postgres, Ollama, and policy count.",
  {},
  async () => {
    try {
      const response = await fetch(`${AGENT_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "unhealthy",
                  agent: "unreachable",
                  message: `Agent returned ${response.status}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const health = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: health.status,
                agent: health.status === "ok" ? "running" : "degraded",
                postgres: health.postgres,
                ollama: health.ollama,
                policies_loaded: health.policies_loaded,
                documents_in_kb: health.docs_in_kb,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "unavailable",
                agent: "unreachable",
                error: error instanceof Error ? error.message : String(error),
                tip: `Check if Agent is running at ${AGENT_URL}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// V2.0 Tools
server.tool(
  "policy_compliance_report",
  "Automatically scan codebase for policy violations. Provides detailed compliance report with violations, suggestions, and compliance score.",
  {
    directory: z.string().describe("Path to scan (absolute or relative)"),
    recursive: z.boolean().optional().default(true).describe("Scan subdirectories"),
    file_patterns: z.string().optional().describe("File patterns to include (e.g., '*.ts,*.js')"),
    policy_keys: z.array(z.string()).optional().describe("Specific policies to check"),
  },
  async ({ directory, recursive, file_patterns, policy_keys }) => {
    try {
      const response = await fetch(`${AGENT_URL}/scan/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directory,
          recursive,
          file_patterns,
          policy_keys,
        }),
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: `Compliance scan failed (${response.status})`,
                  details: await response.text(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const result = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                summary: {
                  files_scanned: result.files_scanned || 0,
                  violations_found: result.violations?.length || 0,
                  compliance_score: result.compliance_score || 1.0,
                },
                violations: result.violations || [],
                scan_time_ms: result.scan_time_ms || 0,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Failed to run compliance report",
                details: error instanceof Error ? error.message : String(error),
                tip: "Ensure directory exists and Agent is running",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.tool(
  "suggest_refactoring",
  "Get AI-powered code improvement suggestions. Analyzes code for security, performance, readability, and maintainability issues.",
  {
    code_snippet: z.string().describe("Code to analyze for improvements"),
    context: z.string().optional().describe("Language/framework context (e.g., 'typescript-service')"),
    focus_areas: z.array(z.string()).optional().describe("Areas to focus on (e.g., ['performance', 'security'])"),
  },
  async ({ code_snippet, context, focus_areas }) => {
    try {
      const response = await fetch(`${AGENT_URL}/refactor/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code_snippet,
          context: context || "general",
          focus_areas: focus_areas || ["all"],
        }),
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: `Refactoring analysis failed (${response.status})`,
                  details: await response.text(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const result = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                suggestions: result.suggestions || [],
                overall_score: result.overall_score || 0,
                analysis_time_ms: result.analysis_time_ms || 0,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Failed to generate refactoring suggestions",
                details: error instanceof Error ? error.message : String(error),
                tip: "Check code snippet syntax and Agent availability",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.tool(
  "generate_adr",
  "Create Architecture Decision Record (ADR) from template. Generates formatted markdown file with proper numbering.",
  {
    title: z.string().describe("ADR title"),
    context: z.string().describe("Background and problem statement"),
    decision: z.string().describe("The decision made"),
    consequences: z.string().optional().describe("Positive and negative outcomes"),
    alternatives: z.string().optional().describe("Other options considered"),
    status: z.enum(["proposed", "accepted", "deprecated", "superseded"]).optional().default("proposed").describe("ADR status"),
  },
  async ({ title, context, decision, consequences, alternatives, status }) => {
    try {
      const response = await fetch(`${AGENT_URL}/adr/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          context,
          decision,
          consequences,
          alternatives,
          status,
        }),
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: `ADR generation failed (${response.status})`,
                  details: await response.text(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const result = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                adr: {
                  number: result.number,
                  title: result.title,
                  status: result.status,
                  date: result.date,
                  file_path: result.file_path,
                  content: result.content,
                },
                next_steps: result.next_steps || [
                  "Review with team",
                  "Update status to 'accepted' after approval",
                  `Load into knowledge base: load_policy policy_file: '${result.file_path}'`,
                ],
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Failed to generate ADR",
                details: error instanceof Error ? error.message : String(error),
                tip: "Ensure ADR template exists and Agent is configured",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.tool(
  "get_metrics",
  "Get real-time system performance and usage metrics. Includes query latency, storage stats, and system health.",
  {
    time_range: z.string().optional().default("1h").describe("Time window (e.g., '5m', '1h', '24h', '7d')"),
    metric_types: z.array(z.string()).optional().describe("Filter metrics (e.g., ['queries', 'performance', 'storage'])"),
  },
  async ({ time_range, metric_types }) => {
    try {
      const response = await fetch(`${AGENT_URL}/metrics`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: `Failed to fetch metrics (${response.status})`,
                  details: await response.text(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const result = await response.json();

      // Build metrics object
      const metrics: Record<string, unknown> = {
        queries: result.queries || {
          total: 0,
          avg_latency_ms: 0,
          p95_latency_ms: 0,
          p99_latency_ms: 0,
          error_rate: 0,
        },
        storage: result.storage || {
          documents: 0,
          policies: 0,
          total_size_mb: 0,
          vector_index_size_mb: 0,
        },
        system: result.system || {
          agent_uptime_hours: 0,
          postgres_connections: 0,
          ollama_status: "unknown",
          memory_usage_mb: 0,
          cpu_usage_percent: 0,
        },
      };

      // Filter by metric_types if specified
      if (metric_types && metric_types.length > 0) {
        const filtered: Record<string, unknown> = {};
        for (const type of metric_types) {
          if (type in metrics) {
            filtered[type] = metrics[type];
          }
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  time_range,
                  metrics: filtered,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                time_range,
                metrics,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Failed to retrieve metrics",
                details: error instanceof Error ? error.message : String(error),
                tip: "Check Agent availability and metrics endpoint configuration",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  /* eslint-disable no-console */
  console.error(`[llm-memory MCP V2.0] Server started`);
  console.error(`[llm-memory MCP V2.0] Connected to Agent at ${AGENT_URL}`);
  console.error(`[llm-memory MCP V2.0] Available tools: 8 (4 V1 + 4 V2.0)`);
  /* eslint-enable no-console */
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[llm-memory MCP] Fatal error:", error);
  process.exit(1);
});
