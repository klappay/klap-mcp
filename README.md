<img src="./docs/public/logo.png" alt="Klap" width="80" />

# @klappay/mcp

A local [Model Context Protocol](https://modelcontextprotocol.io) server for
the Klap Core API. Your AI assistant (Claude Code, Claude Desktop, Cursor,
or any MCP client) runs it on your own machine over stdio with `npx`.
Nothing is hosted by Klappay: the server talks straight to the Klap API with
the key [`klap login`](https://github.com/klappay/klap-cli) already stored in
`~/.klap/config.json`.

What the assistant can do with it:

- **Read**: look up a charge and its timeline, list webhooks and their
  deliveries, list accepted `(token, network)` pairs, run metrics queries.
- **Test mode**: create charges, re-check them on-chain, retry webhook
  deliveries and push a sandbox charge through its payment states.
- **Live mode**: read-only by default. Writes are only registered when
  you opt in explicitly.

Moving money (escrow release/refund) and managing webhook endpoints or
payout recipients are never exposed. See [Security](./docs/security.md).

## Install

Requires Node.js 24+. Log in once with the CLI so the key lives in
`~/.klap/config.json` instead of your MCP client's config file:

```sh
npx @klappay/cli login --api-key - --base-url https://api.klap.example
```

Paste the key on stdin and press Ctrl-D. `--api-key -` keeps the key out of
your shell history; `KLAP_API_KEY=... npx @klappay/cli login --base-url ...`
works too.

Then add one server per environment. Keeping test and live as separate
servers means the assistant always knows which one it is talking to, and
you can turn live off without touching test.

### Claude Code

```sh
claude mcp add klap-test -- npx -y @klappay/mcp@1.1.0
claude mcp add klap-live -e KLAP_ENV=live -- npx -y @klappay/mcp@1.1.0
```

### Claude Desktop (`claude_desktop_config.json`) and Cursor (`~/.cursor/mcp.json`)

Both use the same shape:

```json
{
  "mcpServers": {
    "klap-test": {
      "command": "npx",
      "args": ["-y", "@klappay/mcp@1.1.0"]
    },
    "klap-live": {
      "command": "npx",
      "args": ["-y", "@klappay/mcp@1.1.0"],
      "env": { "KLAP_ENV": "live" }
    }
  }
}
```

Pin the exact version as above rather than `@latest`: an MCP server runs
with your API key, so upgrade it on purpose. On startup it prints one line
to stderr, e.g. `klap-mcp: test → api.example.com`, and never the key.

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `KLAP_ENV` | `test` | `test` or `live`, exactly. Anything else refuses to start. |
| `KLAP_API_KEY` | unset | Use this key instead of `~/.klap/config.json`. Requires `KLAP_BASE_URL`. Its prefix must match `KLAP_ENV`. |
| `KLAP_BASE_URL` | stored `baseUrl` | Required with `KLAP_API_KEY`. With a stored key it must equal the stored `baseUrl`. |
| `KLAP_MCP_ALLOW_LIVE_WRITES` | unset | Set to exactly `1` to register `charges_create`, `charges_check` and `webhooks_retry_delivery` in live. |

An empty value counts as unset. Full rules: [Configuration](./docs/configuration.md).

## Tools

| Tool | Test | Live | Live + writes |
|---|---|---|---|
| `klap_status` | yes | yes | yes |
| `charges_get` | yes | yes | yes |
| `charges_timeline` | yes | yes | yes |
| `webhooks_list` | yes | yes | yes |
| `webhooks_list_deliveries` | yes | yes | yes |
| `networks_get` | yes | yes | yes |
| `metrics_query` | yes | yes | yes |
| `charges_create` | yes | no | yes |
| `charges_check` | yes | no | yes |
| `webhooks_retry_delivery` | yes | no | yes |
| `sandbox_trigger` | yes | no | no |

Every result is JSON and carries `environment`. Inputs and outputs are
described in [Tools](./docs/tools.md).

## Security notes

- Live is read-only unless `KLAP_MCP_ALLOW_LIVE_WRITES=1`.
- A key stored by `klap login` is only ever sent to the base URL it was
  stored with. Pointing `KLAP_BASE_URL` somewhere else refuses to start.
- Plain `http://` is only accepted for `localhost`, `127.0.0.1` and `[::1]`.
- API responses are filtered through the published `@klappay/types`
  schemas before the assistant sees them; unknown fields are dropped and a
  charge's `metadata` is left out unless asked for.
- Not available at all: escrow `release`/`refund`, webhook
  create/delete/rotate-secret, recipient changes, live event streams, QR
  codes and swap quotes.

More in [Security](./docs/security.md).

## Documentation

Full docs live in [`docs/`](./docs) and as a browsable site at
[mcp.klappay.com](https://mcp.klappay.com), which also publishes
[`llms.txt`](https://mcp.klappay.com/llms.txt) and
[`llms-full.txt`](https://mcp.klappay.com/llms-full.txt).

| Topic | |
|---|---|
| [Getting started](./docs/getting-started.md) | Log in, add the server, first prompts |
| [Configuration](./docs/configuration.md) | How the environment and key are chosen, every refusal |
| [Tools](./docs/tools.md) | Every tool's input, output and availability |
| [Security](./docs/security.md) | Threat model, what's excluded and why |

## License

[MIT](./LICENSE)
