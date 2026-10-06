# Security

An MCP server hands an AI model the ability to call an API with your key.
The model can be wrong, and text it reads (a charge's metadata, a webhook
URL, an API error) can try to steer it. This server is built so that a
confused or manipulated assistant can do as little damage as possible.

## Where the key goes

- The key is read from `~/.klap/config.json` (via
  `@klappay/cli/credentials`, which refuses symlinked paths and keys stored
  in the wrong slot) or from `KLAP_API_KEY`. It is sent only as the
  `Authorization` header to the configured base URL.
- A stored key is bound to the base URL stored with it. Setting a different
  `KLAP_BASE_URL` refuses to start rather than sending that key to a new
  host. To use another host, pass `KLAP_API_KEY` and `KLAP_BASE_URL`
  together.
- `http://` is only accepted for loopback hosts; base URLs with embedded
  credentials are refused.
- The key prefix must match `KLAP_ENV`, so a live key can't be used by a
  server you think is in test, or the other way round.
- The key never appears in tool results, startup output or refusal
  messages. Request logging (`debug`) is never enabled.

## Live is read-only by default

In `live` only read tools are registered. The model can't call a write tool
that doesn't exist, whatever it is told. `KLAP_MCP_ALLOW_LIVE_WRITES=1`
(exactly `1`) adds `charges_create`, `charges_check` and
`webhooks_retry_delivery`. `sandbox_trigger` is never available in live.
Run test and live as separate servers so you can enable or disable live
independently.

## Excluded on purpose

| Not exposed | Why |
|---|---|
| Escrow `release` / `refund` | They move funds out of a charge. That stays a deliberate human action. |
| Webhook create / delete / rotate secret | Pointing webhooks somewhere else, or rotating a secret, can silently break or redirect your integration. |
| Recipient (payout) changes | They decide where money goes. |
| Live event streams (`watch`) | Long-lived streams don't fit a request/response tool. |
| QR codes and swap quotes | Payer-facing features with no use to an assistant. |

## What the model sees

- Responses are parsed through `@klappay/types` schemas, dropping any field
  the schema doesn't define. A response that doesn't fit the schema is
  reported as `unexpected_response`, not forwarded.
- A charge's `metadata` (free-form merchant data, possibly customer
  details) is only included when `charges_get` is called with
  `includeMetadata: true`.
- Webhook URLs are reduced to origin + path, removing credentials and
  tokens people often put in a URL's userinfo or query string.
- Unexpected errors return a generic message; details go to stderr for you,
  not to the model.

## stdout

stdout carries only MCP JSON-RPC messages. `console.log`, `console.info`
and `console.debug` are redirected to stderr before anything else loads,
so no dependency can corrupt the protocol stream.

## Reporting a problem

Report security issues privately to the Klappay team rather than in a
public issue.
