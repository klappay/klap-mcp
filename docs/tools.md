# Tools

Every result is a JSON object with an `environment` field (`test` or
`live`). It is returned both as text and as `structuredContent`. API
responses are parsed through the matching `@klappay/types` schema first:
fields the schema doesn't know are dropped, and a response that doesn't
match at all becomes an `unexpected_response` error instead of being passed
through.

Ids are checked before any request is sent: charge ids look like `ch_...`,
webhook ids `wh_...`, delivery ids `ev_...`, followed by letters and digits
only.

## Errors

A failed call returns `isError: true` with:

```json
{
  "environment": "test",
  "error": { "code": "charge_not_found", "status": 404, "message": "Charge not found" }
}
```

`code` and `status` come straight from the Klap API. Locally detected
problems use `validation_error` (invalid input), `unexpected_response` (the
API answered with something the schema rejects) or `unexpected_error`
(anything else; details go to the server's stderr only). Input that fails
the tool's schema is rejected by the MCP SDK before the tool runs.

## Read tools

Available in every environment, annotated `readOnlyHint: true`.

### `klap_status`

No input. Returns `{ environment, host }`, where `host` is the API host
(and port) only. Makes no API call.

### `charges_get`

| Input | |
|---|---|
| `id` | charge id |
| `includeMetadata` | boolean, default `false` |

Returns `{ charge }` (`ChargeSchema`). The charge's `metadata` object
(free-form merchant data, which may contain customer details) is left out
unless `includeMetadata` is `true`.

### `charges_timeline`

Input `{ id }`. Returns `{ chargeId, events }` (`TimelineEventSchema[]`).

### `webhooks_list`

No input. Returns `{ webhooks }` (`WebhookListItemSchema[]`). Each `url` is
reduced to origin + path: any username/password, query string and fragment
are removed. Secrets are never returned, only the display `hint`.

### `webhooks_list_deliveries`

| Input | |
|---|---|
| `webhookId` | webhook id |
| `limit` | 1–100, default 20 |
| `cursor` | the previous page's `nextCursor` |

Returns `{ webhookId, data, nextCursor, hasMore }`
(`PaginatedWebhookDeliveriesSchema`).

### `networks_get`

No input. Returns `{ acceptedPayments }` (`CapabilitiesSchema`): the
`(token, network)` pairs this environment accepts for new charges.

### `metrics_query`

Input `{ query }`, where `query` is a `MetricsQuerySchema` request
(resource, metrics, `dateRange`, optional filters/groupBy/limit). Returns
the `MetricsQueryResultSchema` fields (`data` rows and `meta`).

## Write tools

Available in `test`, and in `live` only with `KLAP_MCP_ALLOW_LIVE_WRITES=1`.
Annotated `readOnlyHint: false`.

### `charges_create`

Input is `CreateChargeSchema` without `escrow` and `redirectUrl`; sending
either is rejected. Pass `idempotencyKey` to make a retry safe; without it
every call creates a new charge. Returns `{ charge }` without `metadata`
(including `amount`, `acceptedPayments` and `splitRecipients`).

Annotations: `destructiveHint: false`, `idempotentHint: false`.

### `charges_check`

| Input | |
|---|---|
| `id` | charge id |
| `txHash` | optional `0x` + 64 hex transaction hash |
| `network` | required together with `txHash` |

Asks the API to re-check the charge on-chain now. Returns `{ charge }`
(`CheckChargeResponseSchema` without `metadata`).

When `txHash` actually paid the charge, the result carries on-chain
evidence of who paid: `transactionSender` (the transaction's own
`from`), `tokenSenders` (the `from` of each paying accepted-token
transfer, which covers a wallet behind a gas-sponsoring relayer) and
`userOperationSenders` (the ERC-4337 account whose own user operation
paid). This is evidence, not identity. Both arrays are `[]` whenever
`transactionSender` is `null`.

Annotations: `destructiveHint: false`, `idempotentHint: true`.

### `webhooks_retry_delivery`

Input `{ webhookId, deliveryId }`. Re-sends one delivery to its endpoint;
the receiver processes that event again. Returns
`{ webhookId, deliveryId, retried: true }`.

Annotations: `destructiveHint: true`.

## Sandbox tool

### `sandbox_trigger`

Test environment only, never registered in live.

| Input | |
|---|---|
| `chargeId` | charge id |
| `event` | `charge.confirmed`, `charge.partially_paid`, `charge.overpaid`, `charge.expired`, `charge.underpaid`, `charge.settled` or `charge.settlement_failed` |
| `amount` | optional, for `charge.partially_paid`/`charge.overpaid` |

Returns `{ charge }` without `metadata`. Annotations: `destructiveHint: true`
(the state change can't be undone on that charge).
