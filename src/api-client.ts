import axios, { AxiosError } from "axios";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const API_BASE_URL = "https://api.invapi.org";
const TIMEOUT_MS = 120_000;

function getApiKey(): string {
  const key = process.env.INVAPI_API_KEY;
  if (!key) {
    throw new Error(
      "INVAPI_API_KEY environment variable is required. " +
      "Get your API key at https://invapi.org"
    );
  }
  return key;
}

function baseHeaders(): Record<string, string> {
  return { "x-api-key": getApiKey() };
}

/** POST JSON body, receive JSON response */
export async function postJsonGetJson<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
    headers: { ...baseHeaders(), "Content-Type": "application/json", "Accept": "application/json" },
    timeout: TIMEOUT_MS,
  });
  return response.data as T;
}

/** POST JSON body, receive text response (XML) */
export async function postJsonGetText(endpoint: string, data: unknown): Promise<string> {
  const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
    headers: { ...baseHeaders(), "Content-Type": "application/json" },
    responseType: "text",
    timeout: TIMEOUT_MS,
  });
  return response.data as string;
}

/** POST JSON body, receive binary response (XLSX, PDF) */
export async function postJsonGetBinary(endpoint: string, data: unknown): Promise<Buffer> {
  const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
    headers: { ...baseHeaders(), "Content-Type": "application/json" },
    responseType: "arraybuffer",
    timeout: TIMEOUT_MS,
  });
  return Buffer.from(response.data);
}

/** POST XML/text body, receive JSON response */
export async function postXmlGetJson<T>(endpoint: string, xml: string): Promise<T> {
  const response = await axios.post(`${API_BASE_URL}${endpoint}`, xml, {
    headers: { ...baseHeaders(), "Content-Type": "application/xml", "Accept": "application/json" },
    timeout: TIMEOUT_MS,
  });
  return response.data as T;
}

/** POST binary body (PDF), receive JSON response */
export async function postBinaryGetJson<T>(
  endpoint: string,
  buffer: Buffer,
  contentType: string
): Promise<T> {
  const response = await axios.post(`${API_BASE_URL}${endpoint}`, buffer, {
    headers: { ...baseHeaders(), "Content-Type": contentType, "Accept": "application/json" },
    timeout: TIMEOUT_MS,
  });
  return response.data as T;
}

/** GET request, receive JSON */
export async function getJson<T>(endpoint: string): Promise<T> {
  const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
    headers: { ...baseHeaders(), "Accept": "application/json" },
    timeout: 30_000,
  });
  return response.data as T;
}

// ── File helpers ──

export async function readFileAsBuffer(filePath: string): Promise<Buffer> {
  return readFile(filePath);
}

export async function readFileAsString(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}

export async function saveBinaryFile(outputPath: string, data: Buffer): Promise<void> {
  await writeFile(outputPath, data);
}

export function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".webp": "image/webp",
    ".xml": "application/xml",
  };
  return types[ext] ?? "application/octet-stream";
}

export function getFileName(filePath: string): string {
  return basename(filePath);
}

// ── Error handling ──

interface ApiErrorData {
  message?: string;
  statusMessage?: string;
  data?: { errors?: Array<{ path?: string; message?: string }> };
}

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiErrorData>;
    if (axiosErr.response) {
      const { status, data } = axiosErr.response;

      if (status === 400 && data?.data?.errors) {
        const lines = data.data.errors.map(
          (e) => `  - ${e.path ?? "unknown"}: ${e.message ?? "invalid"}`
        );
        return `Validation failed (400):\n${lines.join("\n")}`;
      }

      const messages: Record<number, string> = {
        401: "Authentication failed. Ensure INVAPI_API_KEY is set correctly.",
        402: "Insufficient credits. Top up your account at https://invapi.org.",
        429: "Rate limit exceeded. Wait a moment and retry.",
      };
      if (messages[status]) return `Error: ${messages[status]}`;

      const msg = data?.message ?? data?.statusMessage ?? "Unknown error";
      return `API error (${status}): ${msg}`;
    }

    if (axiosErr.code === "ECONNABORTED") {
      return "Error: Request timed out. The file may be too large or the server is busy.";
    }
    if (axiosErr.code === "ENOTFOUND") {
      return "Error: Cannot reach api.invapi.org. Check your internet connection.";
    }
  }

  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}
