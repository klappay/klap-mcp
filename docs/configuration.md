# Configuration

The server reads four environment variables. An empty string counts as
unset; any other value, including whitespace, is taken literally.

| Variable | Values |
|---|---|
| `KLAP_ENV` | unset (means `test`), `test` or `live` |
| `KLAP_API_KEY` | a `klap_test_...` or `klap_live_...` key |
| `KLAP_BASE_URL` | the Klap API base URL |
| `KLAP_MCP_ALLOW_LIVE_WRITES` | `1` to enable live writes; anything else leaves them off |

## How the key is chosen

1. `KLAP_ENV` picks the environment. It must be exactly `test` or `live`
   (`LIVE`, ` live` or `production` all refuse).
2. If `KLAP_API_KEY` is set, it is the only key source. `~/.klap/config.json`
   is not read at all. `KLAP_BASE_URL` is required, and the key's prefix
   must match the environment: a `klap_test_` key with `KLAP_ENV=live`
   refuses to start, and so does a `klap_live_` key with `KLAP_ENV` unset.
3. Otherwise the key comes from `~/.klap/config.json`, the slot for the
   chosen environment. When `KLAP_ENV` is unset the test slot is used.
   Unlike the CLI, the server never picks live on its own: if only a live
   key is stored, set `KLAP_ENV=live`. The base URL is the one stored with
   the key. If `KLAP_BASE_URL` is also set it must point to the same place
   (compared on origin and path, ignoring a trailing slash).

## Base URL rules

Whichever base URL ends up in use must:

- parse as a URL;
- use `https://`, or `http://` only for `localhost`, `127.0.0.1` or `[::1]`;
- carry no username or password.

## Live writes

In `live`, only read tools are registered. `KLAP_MCP_ALLOW_LIVE_WRITES=1`
adds `charges_create`, `charges_check` and `webhooks_retry_delivery`.
`sandbox_trigger` is never available in live. In `test` the variable has no
effect; every tool is available.

## Refusals

When the configuration is unsafe or incomplete the server prints one line
to stderr and exits with status 1. Messages never contain key material.

| Situation | What to do |
|---|---|
| `KLAP_ENV` is not `test`/`live` | Fix the value |
| `KLAP_API_KEY` set, `KLAP_BASE_URL` missing | Set both |
| `KLAP_API_KEY` prefix unknown | Use a `klap_test_`/`klap_live_` key |
| Key environment differs from `KLAP_ENV` | Use the matching key or change `KLAP_ENV` |
| No `~/.klap/config.json` and no `KLAP_API_KEY` | Run `klap login --api-key - --base-url <url>` |
| Stored config has no key for the environment | `klap login` with that key, or change `KLAP_ENV` |
| Stored config is corrupted or has a key in the wrong slot | Run `klap logout`, then `klap login` again |
| `~/.klap` or `~/.klap/config.json` is a symlink | Remove the link, then run `klap login` |
| `KLAP_BASE_URL` differs from the stored base URL | Unset it, or pass `KLAP_API_KEY` too |
| Base URL is `http://` on a non-loopback host, or has credentials | Use `https://` without credentials |

## Using a key without `klap login`

For CI or a throwaway setup you can pass the key directly. It then sits in
your MCP client's config file, so prefer `klap login` on a workstation:

```json
{
  "mcpServers": {
    "klap-local": {
      "command": "npx",
      "args": ["-y", "@klappay/mcp@1.0.0"],
      "env": {
        "KLAP_API_KEY": "klap_test_...",
        "KLAP_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```
