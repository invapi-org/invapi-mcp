# @invapi/mcp-server

MCP server for the [Invapi](https://invapi.org) E-Invoicing API — convert, validate, and extract invoices in UBL, CII, ZUGFeRD, Excel, and more.

## Quick Start

```bash
npm install -g @invapi/mcp-server
```

Set your API key (get one at [invapi.org](https://invapi.org)):

```bash
export INVAPI_API_KEY=your-api-key
```

## Usage

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "invapi": {
      "command": "npx",
      "args": ["-y", "@invapi/mcp-server"],
      "env": {
        "INVAPI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add invapi -- npx -y @invapi/mcp-server
```

Then set the environment variable `INVAPI_API_KEY` in your shell.

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

## Development

```bash
git clone https://github.com/invapi/invapi-mcp.git
cd invapi-mcp
npm install
npm run dev
```

## License

MIT
