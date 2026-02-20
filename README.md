# invapi-mcp-server

MCP server for the [Invapi](https://invapi.org) E-Invoicing API — convert, validate, and extract invoices in UBL, CII, ZUGFeRD, Excel, and more.

## Setup

```bash
npm install
npm run build
```

Set your API key:

```bash
export INVAPI_API_KEY=your-api-key
```

Get a key at [invapi.org](https://invapi.org).

## Usage

### Claude Desktop / Claude Code

Add to your MCP config (`claude_desktop_config.json` or `.claude.json`):

```json
{
  "mcpServers": {
    "invapi": {
      "command": "node",
      "args": ["/absolute/path/to/invapi-mcp-server/dist/index.js"],
      "env": {
        "INVAPI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Development

```bash
npm run dev
```

## Tools

### Conversion

| Tool | Description |
|------|-------------|
| `invapi_convert_json_to_ubl` | JSON Invoice → UBL XML |
| `invapi_convert_json_to_cii` | JSON Invoice → CII XML |
| `invapi_convert_ubl_to_json` | UBL XML → JSON Invoice |
| `invapi_convert_cii_to_json` | CII XML → JSON Invoice |
| `invapi_convert_json_to_xlsx` | JSON Invoices → Excel file |
| `invapi_create_zugferd_pdf` | PDF + JSON Invoice → ZUGFeRD PDF |
| `invapi_convert_zugferd_to_json` | ZUGFeRD PDF → JSON Invoice |

### Validation

| Tool | Description |
|------|-------------|
| `invapi_validate_ubl` | Validate UBL XML against XRechnung 3.0.2 (EN 16931) |
| `invapi_validate_cii` | Validate CII XML against XRechnung 3.0.2 (EN 16931) |
| `invapi_validate_xml` | Validate XML with auto-detected format |

### Extraction

| Tool | Description |
|------|-------------|
| `invapi_extract_invoice` | Extract structured invoice data from PDF or image |
| `invapi_extract_qr` | Extract QR code data from image |

### User

| Tool | Description |
|------|-------------|
| `invapi_get_user` | Get account info and remaining API credits |

### Batch

| Tool | Description |
|------|-------------|
| `invapi_batch_convert` | Run up to 100 conversion operations in a single request |

## Project Structure

```
src/
├── index.ts              # Entry point, server setup (stdio transport)
├── api-client.ts         # HTTP client, file helpers, error handling
├── schemas.ts            # Zod schemas for Invoice and sub-types
└── tools/
    ├── conversion.ts     # 7 conversion tools
    ├── validation.ts     # 3 validation tools
    ├── extraction.ts     # 2 extraction tools
    ├── user.ts           # User info / credits
    └── batch.ts          # Batch conversion
```

## License

MIT
