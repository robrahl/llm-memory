#!/usr/bin/env node

/**
 * llm-memory MCP Server
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
 * Tools provided:
 *   - query_knowledge_base
 *   - check_policy_compliance
 *   - load_policy
 *   - get_health_status
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Server,
} from "@modelcontextprotocol/sdk/server/index";
import { z } from "zod";

// Configuration
const AGENT_HOST = process.env.AGENT_HOST || "localhost";
const AGENT_PORT = process.env.AGENT_PORT || "3000";
const AGENT_URL = `http://${AGENT_HOST}:${AGENT_PORT}`;

// Zod schemas for tool inputs
const QueryKnowledgeBaseSchema = z.object({
  query: z.string().describe("Search query for knowledge base"),
  project_key: z.string().optional().describe("Project context (optional)"),
  top_k: z.number().optional().default(5).describe("Number of results to return"),
});

const CheckPolicyComplianceSchema = z.object({
  code_snippet: z.string().describe("Code or design to check"),
  policy_key: z.string().optional().describe("Specific policy to check against (optional)"),
});

const LoadPolicySchema = z.object({
  policy_file: z.string().describe("Path to policy file to load"),
  overwrite: z.boolean().optional().default(false).describe("Overwrite existing policy"),
});

const HealthSchema = z.object({});

// Tool definitions
const tools = [
  {
    name: "query_knowledge_base",
    description:
      "Search llm-memory knowledge base for architectural decisions, patterns, and guidelines. Returns relevant documents with source citations.",
    inputSchema: QueryKnowledgeBaseSchema,
  },
  {
    name: "check_policy_compliance",
    description:
      "Check if code/design follows established architectural policies. Returns compliance report with suggestions.",
    inputSchema: CheckPolicyComplianceSchema,
  },
  {
    name: "load_policy",
    description:
      "Load or update an architectural policy in the knowledge base. Requires authentication.",
    inputSchema: LoadPolicySchema,
  },
  {
    name: "get_health_status",
    description:
      "Check health of llm-memory system: Agent service, Postgres, Ollama, and policy count.",
    inputSchema: HealthSchema,
  },
];

// Tool handlers
async function queryKnowledgeBase(input: z.infer<typeof QueryKnowledgeBaseSchema>) {
  try {
    const response = await fetch(`${AGENT_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: input.query,
        project_key: input.project_key || "default",
        topK: input.top_k,
      }),
    });

    if (!response.ok) {
      return {
        error: `Agent returned ${response.status}`,
        details: await response.text(),
      };
    }

    const result = await response.json();
    return {
      success: true,
      answer: result.answer,
      sources: result.sources,
      latency_ms: result.latency_ms,
    };
  } catch (error) {
    return {
      error: "Failed to query knowledge base",
      details: error instanceof Error ? error.message : String(error),
      tip: `Check if Agent is running at ${AGENT_URL}`,
    };
  }
}

async function checkPolicyCompliance(
  input: z.infer<typeof CheckPolicyComplianceSchema>
) {
  try {
    const response = await fetch(`${AGENT_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `Check if this code follows our policies:\n\n${input.code_snippet}`,
        project_key: "default",
        topK: 3,
      }),
    });

    if (!response.ok) {
      return {
        error: `Agent returned ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      compliance_feedback: result.answer,
      relevant_policies: result.sources,
      suggested_changes: result.suggestions || [],
    };
  } catch (error) {
    return {
      error: "Failed to check policy compliance",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function loadPolicy(input: z.infer<typeof LoadPolicySchema>) {
  try {
    const response = await fetch(`${AGENT_URL}/policy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policy_file: input.policy_file,
        overwrite: input.overwrite,
      }),
    });

    if (!response.ok) {
      return {
        error: `Failed to load policy (${response.status})`,
        details: await response.text(),
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: `Policy loaded successfully`,
      policy_key: result.policy_key,
      version: result.version,
    };
  } catch (error) {
    return {
      error: "Failed to load policy",
      details: error instanceof Error ? error.message : String(error),
      tip: "Ensure policy file exists and Agent is running",
    };
  }
}

async function getHealthStatus() {
  try {
    const response = await fetch(`${AGENT_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return {
        status: "unhealthy",
        agent: "unreachable",
        message: `Agent returned ${response.status}`,
      };
    }

    const health = await response.json();
    return {
      status: health.status,
      agent: health.status === "ok" ? "running" : "degraded",
      postgres: health.postgres,
      ollama: health.ollama,
      policies_loaded: health.policies_loaded,
      documents_in_kb: health.docs_in_kb,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unavailable",
      agent: "unreachable",
      error: error instanceof Error ? error.message : String(error),
      tip: `Check if Agent is running at ${AGENT_URL}`,
    };
  }
}

// Create server
const server = new Server(
  {
    name: "llm-memory",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register request handlers
server.requestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.requestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const toolInput = request.params.arguments;

  let result;

  try {
    switch (toolName) {
      case "query_knowledge_base":
        result = await queryKnowledgeBase(
          QueryKnowledgeBaseSchema.parse(toolInput)
        );
        break;

      case "check_policy_compliance":
        result = await checkPolicyCompliance(
          CheckPolicyComplianceSchema.parse(toolInput)
        );
        break;

      case "load_policy":
        result = await loadPolicy(LoadPolicySchema.parse(toolInput));
        break;

      case "get_health_status":
        result = await getHealthStatus();
        break;

      default:
        result = {
          error: `Unknown tool: ${toolName}`,
          available_tools: tools.map((t) => t.name),
        };
    }
  } catch (error) {
    result = {
      error: "Tool execution failed",
      details: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[llm-memory MCP] Server started`);
  console.error(`[llm-memory MCP] Connected to Agent at ${AGENT_URL}`);
}

main().catch((error) => {
  console.error("[llm-memory MCP] Fatal error:", error);
  process.exit(1);
});
