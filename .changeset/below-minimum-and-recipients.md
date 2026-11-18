---
"@klappay/mcp": minor
---

Support the Klap API's gas fee and `below_minimum` settlement state, and add read-only recipient tools. Bumps `@klappay/types` to 7.0.0, `@klappay/node` to 5.4.0 and `@klappay/cli` to 1.7.0. This fixes `charges_get`, `charges_list`, `charges_check`, `charges_timeline`, `webhooks_list` and `webhooks_list_deliveries` answering `unexpected_response` when a charge, webhook or delivery carried the new state or event. Charges now include `gasFeeAmount` and `requestedAmount`, plus `selfSettlement` while `below_minimum`, and `sandbox_trigger` accepts `charge.settlement_below_minimum`. Adds `recipients_list` (`label` is opt-in via `includeLabels`) and `recipients_transferability`, both read-only and requiring the `recipients:read` scope.
