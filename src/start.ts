import { loadCredentials } from '@klappay/cli/credentials'
import { createClient } from '@klappay/node'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { resolveServerEnvironment } from './environment'
import { hostOf } from './redact'
import { createServer } from './server'
import { SERVER_NAME } from './server-name'

export async function start(): Promise<void> {
  const resolved = await resolveServerEnvironment(
    {
      KLAP_ENV: process.env.KLAP_ENV,
      KLAP_API_KEY: process.env.KLAP_API_KEY,
      KLAP_BASE_URL: process.env.KLAP_BASE_URL,
      KLAP_MCP_ALLOW_LIVE_WRITES: process.env.KLAP_MCP_ALLOW_LIVE_WRITES,
    },
    loadCredentials,
  )
  if (!resolved.ok) {
    console.error(`${SERVER_NAME}: ${resolved.message}`)
    process.exit(1)
  }

  const { apiKey, baseUrl, environment, allowLiveWrites } = resolved
  const client = createClient({ apiKey, baseUrl })
  const server = createServer({ client, environment, baseUrl, allowLiveWrites })
  await server.connect(new StdioServerTransport())

  const writes = environment === 'live' && allowLiveWrites ? ' (live writes enabled)' : ''
  console.error(`${SERVER_NAME}: ${environment} → ${hostOf(baseUrl)}${writes}`)
}
