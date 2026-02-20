import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BatchOperationSchema } from "../schemas.js";
import { postJsonGetJson, handleApiError } from "../api-client.js";

interface BatchResult {
  results: Array<{
    id: string;
    success: boolean;
    output?: unknown;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    processing_time_ms: number;
  };
}

export function registerBatchTools(server: McpServer): void {
  server.registerTool(
    "invapi_batch_convert",
    {
      title: "Batch Convert Invoices",
      description:
        "Process multiple invoice conversion operations in a single request (up to 100). " +
        "Each operation is processed independently — failures in one do not affect others.\n\n" +
        "Supported operations:\n" +
        "  - json_to_ubl: Invoice JSON → UBL XML\n" +
        "  - json_to_cii: Invoice JSON → CII XML\n" +
        "  - ubl_to_json: UBL XML string → Invoice JSON\n" +
        "  - cii_to_json: CII XML string → Invoice JSON\n" +
        "  - zugferd_to_json: ZUGFeRD data → Invoice JSON\n\n" +
        "Each operation needs an 'id' (returned in results), an 'operation' type, and 'input' data.",
      inputSchema: {
        operations: z
          .array(BatchOperationSchema)
          .min(1)
          .max(100)
          .describe("Array of conversion operations to perform"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ operations }) => {
      try {
        const result = await postJsonGetJson<BatchResult>("/api/v1/batch/convert", {
          operations,
        });

        const lines: string[] = [
          `Batch complete: ${result.summary.successful}/${result.summary.total} succeeded` +
            ` (${result.summary.processing_time_ms}ms)`,
          "",
        ];

        for (const r of result.results) {
          if (r.success) {
            const preview =
              typeof r.output === "string"
                ? r.output.slice(0, 200) + (r.output.length > 200 ? "…" : "")
                : JSON.stringify(r.output, null, 2).slice(0, 200);
            lines.push(`[${r.id}] OK: ${preview}`);
          } else {
            lines.push(`[${r.id}] FAILED: ${r.error ?? "Unknown error"}`);
          }
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );
}
