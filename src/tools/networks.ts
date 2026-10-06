import { CapabilitiesSchema } from '@klappay/types'
import { runTool } from '../result'
import type { ToolDefinition } from './definition'

export const networkTools: ToolDefinition[] = [
  {
    name: 'networks_get',
    access: 'read',
    register(server, { client, environment }) {
      server.registerTool(
        'networks_get',
        {
          title: 'Get accepted networks',
          description:
            'List the (token, network) payment pairs this environment accepts right now — the same list charges_create validates acceptedPayments against.',
          annotations: { readOnlyHint: true, openWorldHint: true },
        },
        () =>
          runTool(environment, async () => CapabilitiesSchema.parse(await client.networks.get())),
      )
    },
  },
]
