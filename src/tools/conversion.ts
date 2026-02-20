import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { InvoiceSchema } from "../schemas.js";
import {
  postJsonGetText,
  postJsonGetJson,
  postJsonGetBinary,
  postXmlGetJson,
  postBinaryGetJson,
  readFileAsBuffer,
  readFileAsString,
  saveBinaryFile,
  getContentType,
  getFileName,
  handleApiError,
} from "../api-client.js";

export function registerConversionTools(server: McpServer): void {
  // ── JSON → UBL ──

  server.registerTool(
    "invapi_convert_json_to_ubl",
    {
      title: "Convert JSON to UBL XML",
      description:
        "Converts an Invoice JSON object to UBL (Universal Business Language) XML format. " +
        "Optionally saves the XML to a file. Returns the UBL XML string.",
      inputSchema: {
        invoice: InvoiceSchema,
        output_path: z
          .string()
          .optional()
          .describe("File path to save the UBL XML output. If omitted, XML is returned inline."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ invoice, output_path }) => {
      try {
        const xml = await postJsonGetText("/api/v1/json/ubl", invoice);
        if (output_path) {
          await saveBinaryFile(output_path, Buffer.from(xml, "utf-8"));
          return { content: [{ type: "text", text: `UBL XML saved to ${output_path}` }] };
        }
        return { content: [{ type: "text", text: xml }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── JSON → CII ──

  server.registerTool(
    "invapi_convert_json_to_cii",
    {
      title: "Convert JSON to CII XML",
      description:
        "Converts an Invoice JSON object to CII (Cross-Industry Invoice) XML format. " +
        "Optionally saves the XML to a file. Returns the CII XML string.",
      inputSchema: {
        invoice: InvoiceSchema,
        output_path: z
          .string()
          .optional()
          .describe("File path to save the CII XML output. If omitted, XML is returned inline."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ invoice, output_path }) => {
      try {
        const xml = await postJsonGetText("/api/v1/json/cii", invoice);
        if (output_path) {
          await saveBinaryFile(output_path, Buffer.from(xml, "utf-8"));
          return { content: [{ type: "text", text: `CII XML saved to ${output_path}` }] };
        }
        return { content: [{ type: "text", text: xml }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── UBL → JSON ──

  server.registerTool(
    "invapi_convert_ubl_to_json",
    {
      title: "Convert UBL XML to JSON",
      description:
        "Converts a UBL XML invoice to the Invapi JSON Invoice format. " +
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
        const xmlContent = xml ?? (file_path ? await readFileAsString(file_path) : null);
        if (!xmlContent) {
          return {
            content: [{ type: "text", text: "Error: Provide either 'xml' or 'file_path'." }],
            isError: true,
          };
        }
        const result = await postXmlGetJson("/api/v1/ubl/json", xmlContent);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── CII → JSON ──

  server.registerTool(
    "invapi_convert_cii_to_json",
    {
      title: "Convert CII XML to JSON",
      description:
        "Converts a CII XML invoice to the Invapi JSON Invoice format. " +
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
        const xmlContent = xml ?? (file_path ? await readFileAsString(file_path) : null);
        if (!xmlContent) {
          return {
            content: [{ type: "text", text: "Error: Provide either 'xml' or 'file_path'." }],
            isError: true,
          };
        }
        const result = await postXmlGetJson("/api/v1/cii/json", xmlContent);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── JSON → XLSX ──

  server.registerTool(
    "invapi_convert_json_to_xlsx",
    {
      title: "Convert Invoices to Excel",
      description:
        "Converts one or more Invoice JSON objects to an Excel (.xlsx) file. " +
        "The output_path is required since Excel files are binary.",
      inputSchema: {
        invoices: z.array(InvoiceSchema).min(1).describe("Array of Invoice objects to export"),
        output_path: z.string().describe("File path to save the .xlsx file"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ invoices, output_path }) => {
      try {
        const buffer = await postJsonGetBinary("/api/v1/json/xlsx", { invoices });
        await saveBinaryFile(output_path, buffer);
        return {
          content: [
            {
              type: "text",
              text: `Excel file saved to ${output_path} (${invoices.length} invoice(s))`,
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── JSON → ZUGFeRD PDF ──

  server.registerTool(
    "invapi_create_zugferd_pdf",
    {
      title: "Create ZUGFeRD PDF",
      description:
        "Creates a ZUGFeRD/Factur-X PDF by embedding CII XML invoice data into an existing PDF. " +
        "Requires both a source PDF file and an Invoice JSON object. " +
        "The invoice is converted to CII XML, validated, and embedded into the PDF.",
      inputSchema: {
        pdf_path: z.string().describe("Path to the source PDF file"),
        invoice: InvoiceSchema,
        output_path: z.string().describe("Path to save the resulting ZUGFeRD PDF"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ pdf_path, invoice, output_path }) => {
      try {
        const pdfBuffer = await readFileAsBuffer(pdf_path);
        const requestBody = {
          file: {
            content: pdfBuffer.toString("base64"),
            contentType: "application/pdf",
            fileName: getFileName(pdf_path),
          },
          invoice,
        };
        const resultBuffer = await postJsonGetBinary("/api/v1/json/zugferd", requestBody);
        await saveBinaryFile(output_path, resultBuffer);
        return {
          content: [{ type: "text", text: `ZUGFeRD PDF saved to ${output_path}` }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );

  // ── ZUGFeRD PDF → JSON ──

  server.registerTool(
    "invapi_convert_zugferd_to_json",
    {
      title: "Convert ZUGFeRD PDF to JSON",
      description:
        "Extracts the embedded CII XML from a ZUGFeRD/Factur-X PDF and converts it to " +
        "the Invapi JSON Invoice format. The PDF must contain embedded XML invoice data.",
      inputSchema: {
        file_path: z.string().describe("Path to the ZUGFeRD PDF file"),
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
        const result = await postBinaryGetJson("/api/v1/zugferd/json", buffer, "application/pdf");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );
}
