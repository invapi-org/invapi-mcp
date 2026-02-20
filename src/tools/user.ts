import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getJson, handleApiError } from "../api-client.js";

interface UserInfo {
  email: string;
  role: string;
  credits: {
    extraction?: number;
    conversion?: number;
    validation?: number;
    qr?: number;
  };
}

export function registerUserTools(server: McpServer): void {
  server.registerTool(
    "invapi_get_user",
    {
      title: "Get Invapi User Info",
      description:
        "Returns the current Invapi user's email, role, and remaining API credits " +
        "(extraction, conversion, validation, QR). Use this to check your credit balance.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const user = await getJson<UserInfo>("/api/v1/user");
        const lines = [
          `Email: ${user.email}`,
          `Role:  ${user.role}`,
          "",
          "Credits remaining:",
          `  Extraction: ${user.credits.extraction ?? "N/A"}`,
          `  Conversion: ${user.credits.conversion ?? "N/A"}`,
          `  Validation: ${user.credits.validation ?? "N/A"}`,
          `  QR:         ${user.credits.qr ?? "N/A"}`,
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
      }
    }
  );
}
