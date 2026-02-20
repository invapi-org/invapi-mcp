import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { postXmlGetJson, readFileAsString, handleApiError } from "../api-client.js";

interface ValidationResult {
  valid: boolean;
  errors?: Array<{ message: string }>;
}

function formatValidationResult(result: ValidationResult): string {
  if (result.valid) {
    return "Validation passed: The invoice is valid.";
  }

  const lines = ["Validation failed:"];
  if (result.errors?.length) {
    for (const err of result.errors) {
      lines.push(`  - ${err.message}`);
    }
  } else {
    lines.push("  - Unknown validation error");
  }
  return lines.join("\n");
}

async function resolveXmlInput(
  xml: string | undefined,
  file_path: string | undefined
): Promise<string | null> {
  if (xml) return xml;
  if (file_path) return readFileAsString(file_path);
  return null;
}

export function registerValidationTools(server: McpServer): void {
  // ── Validate UBL XML ──

  server.registerTool(
    "invapi_validate_ubl",
    {
      title: "Validate UBL XML",
      description:
        "Validates a UBL XML invoice against XRechnung 3.0.2 (EN 16931) rules. " +
        "Provide either the XML content as a string or a path to an XML file.",
      inputSchema: {
        xml: z.string().optional().describe("UBL XML content as a string"),
        file_path: z.string().optional().describe("Path to a UBL XML file on disk"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ xml, file_path }) => {
      try {
        const xmlContent = await resolveXmlInput(xml, file_path);
        if (!xmlContent) {
          return {
            content: [{ type: "text", text: "Error: Provide either 'xml' or 'file_path'." }],
            isError: true,
          };
        }
        const result = await postXmlGetJson<ValidationResult>("/api/v1/ubl/validate", xmlContent);
        return { content: [{ type: "text", text: formatValidationResult(result) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── Validate CII XML ──

  server.registerTool(
    "invapi_validate_cii",
    {
      title: "Validate CII XML",
      description:
        "Validates a CII XML invoice against XRechnung 3.0.2 (EN 16931) rules. " +
        "Provide either the XML content as a string or a path to an XML file.",
      inputSchema: {
        xml: z.string().optional().describe("CII XML content as a string"),
        file_path: z.string().optional().describe("Path to a CII XML file on disk"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ xml, file_path }) => {
      try {
        const xmlContent = await resolveXmlInput(xml, file_path);
        if (!xmlContent) {
          return {
            content: [{ type: "text", text: "Error: Provide either 'xml' or 'file_path'." }],
            isError: true,
          };
        }
        const result = await postXmlGetJson<ValidationResult>("/api/v1/cii/validate", xmlContent);
        return { content: [{ type: "text", text: formatValidationResult(result) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── Validate XML (auto-detect format) ──

  server.registerTool(
    "invapi_validate_xml",
    {
      title: "Validate XML Invoice",
      description:
        "Validates an XML invoice against XRechnung 3.0.2 (EN 16931) rules. " +
        "The format (UBL or CII) is auto-detected. " +
        "Provide either the XML content as a string or a path to an XML file.",
      inputSchema: {
        xml: z.string().optional().describe("XML invoice content as a string"),
        file_path: z.string().optional().describe("Path to an XML invoice file on disk"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ xml, file_path }) => {
      try {
        const xmlContent = await resolveXmlInput(xml, file_path);
        if (!xmlContent) {
          return {
            content: [{ type: "text", text: "Error: Provide either 'xml' or 'file_path'." }],
            isError: true,
          };
        }
        const result = await postXmlGetJson<ValidationResult>("/api/v1/xml/validate", xmlContent);
        return { content: [{ type: "text", text: formatValidationResult(result) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );
}
