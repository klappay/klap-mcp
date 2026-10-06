import type { KlapEnvironment } from '@klappay/cli/credentials'
import type { KlapClient } from '@klappay/node'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export type ToolContext = {
  client: KlapClient
  environment: KlapEnvironment
  baseUrl: string
}

export type ToolAccess = 'read' | 'write' | 'sandbox'

export type ToolDefinition = {
  name: string
  access: ToolAccess
  register(server: McpServer, context: ToolContext): void
}
