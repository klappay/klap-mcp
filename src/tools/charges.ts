import {
  ChargeSchema,
  CheckChargeRequestSchema,
  CheckChargeResponseSchema,
  CreateChargeSchema,
  TimelineEventSchema,
} from '@klappay/types'
import { z } from 'zod'
import { ChargeIdSchema } from '../ids'
import { ToolInputError, runTool } from '../result'
import { ChargeWithoutMetadataSchema } from './charge-output'
import type { ToolDefinition } from './definition'

const CheckResponseWithoutMetadataSchema = CheckChargeResponseSchema.omit({ metadata: true })
const TimelineSchema = z.array(TimelineEventSchema)

export const CreateChargeToolInputSchema = CreateChargeSchema.innerType()
  .omit({ escrow: true, redirectUrl: true })
  .strict()

const GetChargeInputSchema = z
  .object({
    id: ChargeIdSchema,
    includeMetadata: z
      .boolean()
      .default(false)
      .describe(
        "Include the charge's free-form `metadata` object (merchant-supplied data, may hold customer details). Omitted unless true.",
      ),
  })
  .strict()

const ChargeIdInputSchema = z.object({ id: ChargeIdSchema }).strict()

const CheckChargeInputSchema = CheckChargeRequestSchema.innerType()
  .extend({ id: ChargeIdSchema })
  .strict()

function validationMessage(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ')
}

export const chargeTools: ToolDefinition[] = [
  {
    name: 'charges_get',
    access: 'read',
    register(server, { client, environment }) {
      server.registerTool(
        'charges_get',
        {
          title: 'Get charge',
          description:
            'Fetch one charge by id: status, settlement status, amounts, accepted payment pairs, split recipients and timestamps. `metadata` is left out unless includeMetadata is true.',
          inputSchema: GetChargeInputSchema,
          annotations: { readOnlyHint: true, openWorldHint: true },
        },
        ({ id, includeMetadata }) =>
          runTool(environment, async () => {
            const charge = await client.charges.get(id)
            const schema = includeMetadata ? ChargeSchema : ChargeWithoutMetadataSchema
            return { charge: schema.parse(charge) }
          }),
      )
    },
  },
  {
    name: 'charges_timeline',
    access: 'read',
    register(server, { client, environment }) {
      server.registerTool(
        'charges_timeline',
        {
          title: 'Get charge timeline',
          description:
            'List the lifecycle events of one charge in order (created, transfers detected, confirmed, settled, ...).',
          inputSchema: ChargeIdInputSchema,
          annotations: { readOnlyHint: true, openWorldHint: true },
        },
        ({ id }) =>
          runTool(environment, async () => ({
            chargeId: id,
            events: TimelineSchema.parse(await client.charges.getTimeline(id)),
          })),
      )
    },
  },
  {
    name: 'charges_create',
    access: 'write',
    register(server, { client, environment }) {
      server.registerTool(
        'charges_create',
        {
          title: 'Create charge',
          description: `Create a new ${environment} charge. Escrow charges and redirectUrl are not available through this server. Pass idempotencyKey to make a retry safe; without it every call creates a new charge.`,
          inputSchema: CreateChargeToolInputSchema,
          annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
          },
        },
        (input) =>
          runTool(environment, async () => ({
            charge: ChargeWithoutMetadataSchema.parse(await client.charges.create(input)),
          })),
      )
    },
  },
  {
    name: 'charges_check',
    access: 'write',
    register(server, { client, environment }) {
      server.registerTool(
        'charges_check',
        {
          title: 'Re-check charge on-chain',
          description:
            "Ask the API to re-check a charge's payment on-chain now instead of waiting for the background pass. Optionally pass txHash together with network to verify one specific transaction. Never credits anything that is not really on-chain.",
          inputSchema: CheckChargeInputSchema,
          annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
          },
        },
        ({ id, ...hint }) =>
          runTool(environment, async () => {
            const request = CheckChargeRequestSchema.safeParse(hint)
            if (!request.success) throw new ToolInputError(validationMessage(request.error))
            const checked = await client.charges.check(id, request.data)
            return { charge: CheckResponseWithoutMetadataSchema.parse(checked) }
          }),
      )
    },
  },
]
