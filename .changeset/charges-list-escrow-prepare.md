---
"@klappay/mcp": minor
---

Add `charges_list` (filter by status, paid token/network, `since` and `isOverpaid`, with cursor pagination; the environment is always the server's own and `metadata` is opt-in via `includeMetadata`) and the read-only `charges_prepare_release`/`charges_prepare_refund`, which show the exact Safe transaction an escrow release or refund would execute without signing or submitting anything. Bumps `@klappay/node` to 5.3.0, `@klappay/types` to 6.2.0 and `@klappay/cli` to 1.6.0.
