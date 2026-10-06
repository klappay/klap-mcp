import { SandboxTriggerSchema } from '@klappay/types'
import { ChargeIdSchema } from '../ids'
import { runTool } from '../result'
import { ChargeWithoutMetadataSchema } from './charge-output'
import type { ToolDefinition } from './definition'

const SandboxTriggerInputSchema = SandboxTriggerSchema.extend({ chargeId: ChargeIdSchema }).strict()

export const sandboxTools: ToolDefinition[] = [
  {
    name: 'sandbox_trigger',
    access: 'sandbox',
    register(server, { client, environment }) {
      server.registerTool(
        'sandbox_trigger',
        {
          title: 'Simulate sandbox charge event',
          description:
            'Push a test charge into a payment state (confirmed, partially paid, overpaid, expired, underpaid, settled, settlement failed) without moving funds, and fire the matching webhook. Test environment only.',
          inputSchema: SandboxTriggerInputSchema,
          annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: true,
          },
        },
        ({ chargeId, event, amount }) =>
          runTool(environment, async () => ({
            charge: ChargeWithoutMetadataSchema.parse(
              await client.sandbox.trigger(chargeId, event, amount),
            ),
          })),
      )
    },
  },
]
