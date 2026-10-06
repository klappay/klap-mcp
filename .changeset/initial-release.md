---
'@klappay/mcp': minor
---

Initial release: a local stdio MCP server for the Klap Core API. Uses the key stored by `klap login` (or `KLAP_API_KEY` + `KLAP_BASE_URL`), defaults to the test environment, and is read-only in live unless `KLAP_MCP_ALLOW_LIVE_WRITES=1`. Tools: `klap_status`, `charges_get`, `charges_timeline`, `charges_create`, `charges_check`, `webhooks_list`, `webhooks_list_deliveries`, `webhooks_retry_delivery`, `networks_get`, `metrics_query`, `sandbox_trigger`.
