import type { KlapEnvironment } from '@klappay/cli/credentials'
import type { KlapClient } from '@klappay/node'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { version } from '../package.json'
import { hostOf } from './redact'
import { isToolAllowed } from './tool-policy'
import { chargeTools } from './tools/charges'
import type { ToolDefinition } from './tools/definition'
import { metricsTools } from './tools/metrics'
import { networkTools } from './tools/networks'
import { sandboxTools } from './tools/sandbox'
import { statusTools } from './tools/status'
import { webhookTools } from './tools/webhooks'

import { SERVER_NAME } from './server-name'

export const ALL_TOOLS: readonly ToolDefinition[] = [
  ...statusTools,
  ...chargeTools,
  ...webhookTools,
  ...networkTools,
  ...metricsTools,
  ...sandboxTools,
]

export type CreateServerOptions = {
  client: KlapClient
  environment: KlapEnvironment
  baseUrl: string
  allowLiveWrites: boolean
}

function modeDescription(environment: KlapEnvironment, allowLiveWrites: boolean): string {
  if (environment === 'test') {
    return 'This is the TEST environment: sandbox data and no real funds. Read tools, charges_create, charges_check, webhooks_retry_delivery and sandbox_trigger are available.'
  }
  if (allowLiveWrites) {
    return 'This is the LIVE environment: real merchants, real payers and real funds. Live writes were explicitly enabled (KLAP_MCP_ALLOW_LIVE_WRITES=1): charges_create, charges_check and webhooks_retry_delivery act on real data — confirm with the user before calling them.'
  }
  return 'This is the LIVE environment: real merchants, real payers and real funds. The server is read-only in live; write tools are not registered unless KLAP_MCP_ALLOW_LIVE_WRITES=1 is set.'
}

export function buildInstructions(
  environment: KlapEnvironment,
  baseUrl: string,
  allowLiveWrites: boolean,
): string {
  return [
    `Klap Core API (${hostOf(baseUrl)}), environment: ${environment}.`,
    modeDescription(environment, allowLiveWrites),
    'Moving money out of a charge (escrow release/refund) and managing webhook endpoints or payout recipients are not available through this server.',
  ].join(' ')
}

export function createServer(options: CreateServerOptions): McpServer {
  const { client, environment, baseUrl, allowLiveWrites } = options
  const server = new McpServer(
    { name: SERVER_NAME, version },
    { instructions: buildInstructions(environment, baseUrl, allowLiveWrites) },
  )
  for (const tool of ALL_TOOLS) {
    if (isToolAllowed(tool.access, environment, allowLiveWrites)) {
      tool.register(server, { client, environment, baseUrl })
    }
  }
  return server
}
