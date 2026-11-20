# @klappay/mcp

## 1.4.0

### Minor Changes

- e26ae89: Support the Klap API's gas fee and `below_minimum` settlement state, and add read-only recipient tools. Bumps `@klappay/types` to 7.0.0, `@klappay/node` to 5.4.0 and `@klappay/cli` to 1.7.0. This fixes `charges_get`, `charges_list`, `charges_check`, `charges_timeline`, `webhooks_list` and `webhooks_list_deliveries` answering `unexpected_response` when a charge, webhook or delivery carried the new state or event. Charges now include `gasFeeAmount` and `requestedAmount`, plus `selfSettlement` while `below_minimum`, and `sandbox_trigger` accepts `charge.settlement_below_minimum`. Adds `recipients_list` (`label` is opt-in via `includeLabels`) and `recipients_transferability`, both read-only and requiring the `recipients:read` scope.

## 1.3.1

### Patch Changes

- 0aeec30: List the server in the official MCP Registry as `io.github.klappay/klap-mcp`. The package now carries `mcpName`, `server.json` describes it, and every release publishes it to the registry from CI. The README links to klappay.com.

## 1.3.0

### Minor Changes

- 0f427d5: Add `charges_list` (filter by status, paid token/network, `since` and `isOverpaid`, with cursor pagination; the environment is always the server's own and `metadata` is opt-in via `includeMetadata`) and the read-only `charges_prepare_release`/`charges_prepare_refund`, which show the exact Safe transaction an escrow release or refund would execute without signing or submitting anything. Bumps `@klappay/node` to 5.3.0, `@klappay/types` to 6.2.0 and `@klappay/cli` to 1.6.0.

## 1.2.0

### Minor Changes

- a37c34b: `metrics_query` no longer asks for `query.environment`: the server fills in its own environment. Before, a query without it failed validation, and one with the other environment failed with `environment_mismatch` from the API. An `environment` passed anyway is ignored.

### Patch Changes

- a9b1b77: Bump `@klappay/cli` to 1.4.3, so the `@klappay/cli/credentials` module the server reads `~/.klap/config.json` with matches the latest CLI. Install and docs examples now pin `@klappay/mcp@1.1.0`.

## 1.1.0

### Minor Changes

- 1699c71: Bump `@klappay/node` to 5.2.0, `@klappay/types` to 6.1.0 and `@klappay/cli` to 1.4.2. `charges_check` now also returns `tokenSenders` and `userOperationSenders` alongside `transactionSender`: on-chain evidence of who paid when the payer didn't sign the transaction itself (an EIP-7702 wallet behind a gas-sponsoring relayer, or an ERC-4337 bundled user operation).

## 1.0.1

### Patch Changes

- d83a7f8: Bump `@klappay/node` to 5.1.5 and `@klappay/types` to 6.0.1.
