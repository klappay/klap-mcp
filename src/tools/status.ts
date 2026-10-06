import { hostOf } from '../redact'
import { successResult } from '../result'
import type { ToolDefinition } from './definition'

export const statusTools: ToolDefinition[] = [
  {
    name: 'klap_status',
    access: 'read',
    register(server, { environment, baseUrl }) {
      server.registerTool(
        'klap_status',
        {
          title: 'Klap connection status',
          description:
            'Show which Klap environment (test or live) and API host this server is connected to. Makes no API call.',
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        () => successResult(environment, { host: hostOf(baseUrl) }),
      )
    },
  },
]
