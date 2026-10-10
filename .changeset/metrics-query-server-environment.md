---
"@klappay/mcp": minor
---

`metrics_query` no longer asks for `query.environment`: the server fills in its own environment. Before, a query without it failed validation, and one with the other environment failed with `environment_mismatch` from the API. An `environment` passed anyway is ignored.
