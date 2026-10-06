# Getting started

## 1. Store a test key

`@klappay/mcp` reads the same `~/.klap/config.json` the Klap CLI writes, so
the key never has to appear in your MCP client's config file:

```sh
npx @klappay/cli login --api-key - --base-url https://api.klap.example
```

Paste a `klap_test_...` key on stdin and press Ctrl-D. Reading it from stdin
(`--api-key -`) keeps it out of your shell history; setting `KLAP_API_KEY`
before running the command works too. `--base-url` is required. The file is created with `0600` permissions.
You can store a live key the same way later; both slots live side by side.

## 2. Add the server

Claude Code:

```sh
claude mcp add klap-test -- npx -y @klappay/mcp@0.1.0
```

Claude Desktop (`claude_desktop_config.json`) or Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "klap-test": {
      "command": "npx",
      "args": ["-y", "@klappay/mcp@0.1.0"]
    }
  }
}
```

Restart the client. Its MCP log should show
`klap-mcp: test → <your API host>`. If the server refuses to start, the
same log has a one-line reason; see
[Configuration](./configuration.md#refusals).

## 3. Try it

Ask the assistant things like:

- "Which Klap environment are you connected to?" (`klap_status`)
- "Create a 25 USD test charge payable in USDC on Base, expiring in 15
  minutes." (`charges_create`)
- "Mark that charge as confirmed in the sandbox, then show me its
  timeline." (`sandbox_trigger`, `charges_timeline`)
- "Which of my webhooks failed deliveries recently?" (`webhooks_list`,
  `webhooks_list_deliveries`)

## 4. Add live (optional)

Add a second, separate server with `KLAP_ENV=live`. It is read-only:

```sh
claude mcp add klap-live -e KLAP_ENV=live -- npx -y @klappay/mcp@0.1.0
```

Only add `KLAP_MCP_ALLOW_LIVE_WRITES=1` if you really want the assistant to
create live charges or re-send live webhooks; read
[Security](./security.md) first.

## Where to go next

- [Configuration](./configuration.md): every variable and refusal
- [Tools](./tools.md): what each tool takes and returns
- [Security](./security.md): what is excluded and why

## For LLMs and agents

This site publishes [`llms.txt`](https://mcp.klappay.com/llms.txt), a link
index of every doc page, and
[`llms-full.txt`](https://mcp.klappay.com/llms-full.txt), the full content
of every doc page in one plain-text file. Point an agent or RAG pipeline at
either to give it these docs without scraping HTML. Both regenerate on
every deploy, so they never drift from the pages here.
