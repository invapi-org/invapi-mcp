import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExtractionPartySchema, CategorySchema } from "../schemas.js";
import {
  postJsonGetJson,
  readFileAsBuffer,
  getContentType,
  getFileName,
  handleApiError,
} from "../api-client.js";

export function registerExtractionTools(server: McpServer): void {
  // ── Extract Invoice from PDF / Image ──

  server.registerTool(
    "invapi_extract_invoice",
    {
      title: "Extract Invoice from PDF/Image",
      description:
        "Extracts structured invoice data from a PDF or image file using AI. " +
        "Returns the invoice as a JSON object. " +
        "Optionally pass known parties for better accuracy, custom instructions for the AI, " +
        "categories for classification, and enable QR code extraction.",
      inputSchema: {
        file_path: z.string().describe("Path to the PDF or image file (PNG, JPG, etc.)"),
        qr: z
          .boolean()
          .optional()
          .default(false)
          .describe("Whether to also extract QR code data from the file"),
        parties: z
          .array(ExtractionPartySchema)
          .optional()
          .describe("Known parties (sellers/buyers) to improve extraction accuracy"),
        instructions: z
          .string()
          .optional()
          .describe("Custom instructions for the AI extraction, e.g. 'This is always an incoming invoice'"),
        categories: z
          .array(CategorySchema)
          .optional()
          .describe("Categories for automatic invoice classification"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ file_path, qr, parties, instructions, categories }) => {
      try {
        const buffer = await readFileAsBuffer(file_path);
        const contentType = getContentType(file_path);
        const fileName = getFileName(file_path);

        const requestBody: Record<string, unknown> = {
          file: {
            content: buffer.toString("base64"),
            contentType,
            fileName,
          },
        };
        if (qr) requestBody.qr = true;
        if (parties?.length) requestBody.parties = parties;
        if (instructions) requestBody.instructions = instructions;
        if (categories?.length) requestBody.categories = categories;

        const result = await postJsonGetJson<Record<string, unknown>>(
          "/api/v1/file/json",
          requestBody
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── Extract QR Code from Image ──

  server.registerTool(
    "invapi_extract_qr",
    {
      title: "Extract QR Code from Image",
      description:
        "Scans an image file for QR codes and returns the parsed data as JSON. " +
        "Useful for extracting payment information from invoice QR codes.",
      inputSchema: {
        file_path: z.string().describe("Path to the image file (PNG, JPG, etc.)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ file_path }) => {
      try {
        const buffer = await readFileAsBuffer(file_path);
        const contentType = getContentType(file_path);
        const fileName = getFileName(file_path);

        const requestBody = {
          file: {
            content: buffer.toString("base64"),
            contentType,
            fileName,
          },
        };

        const result = await postJsonGetJson<Record<string, unknown>>(
          "/api/v1/file/qr",
          requestBody
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );
}
