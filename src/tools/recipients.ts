import {
  PaginatedRecipientsSchema,
  PaginationQuerySchema,
  RecipientSchema,
  RecipientTransferabilitySchema,
} from '@klappay/types'
import { z } from 'zod'
import { RecipientIdSchema } from '../ids'
import { runTool } from '../result'
import type { ToolDefinition } from './definition'

const PaginatedRecipientsWithoutLabelSchema = PaginatedRecipientsSchema.extend({
  data: z.array(RecipientSchema.omit({ label: true })),
})

const ListRecipientsInputSchema = PaginationQuerySchema.extend({
  includeLabels: z
    .boolean()
    .default(false)
    .describe(
      "Include each recipient's free-form `label` (merchant-supplied bookkeeping text, may name a person). Omitted unless true.",
    ),
}).strict()

const TransferabilityInputSchema = z.object({ id: RecipientIdSchema }).strict()

export const recipientTools: ToolDefinition[] = [
  {
    name: 'recipients_list',
    access: 'read',
    register(server, { client, environment }) {
      server.registerTool(
        'recipients_list',
        {
          title: 'List recipients',
          description:
            "List this environment's registered split recipients: id, address, payout eligibility and creation time. Paginate with limit and the previous page's nextCursor. `label` is left out unless includeLabels is true. Registering, changing or revoking a recipient is not available through this server. The API key needs the `recipients:read` scope.",
          inputSchema: ListRecipientsInputSchema,
          annotations: { readOnlyHint: true, openWorldHint: true },
        },
        ({ includeLabels, ...page }) =>
          runTool(environment, async () => {
            const recipients = await client.recipients.list(page)
            const schema = includeLabels
              ? PaginatedRecipientsSchema
              : PaginatedRecipientsWithoutLabelSchema
            return schema.parse(recipients)
          }),
      )
    },
  },
  {
    name: 'recipients_transferability',
    access: 'read',
    register(server, { client, environment }) {
      server.registerTool(
        'recipients_transferability',
        {
          title: 'Check recipient transferability',
          description:
            "Report what each token issuer's own contract says about a recipient's address, per token/network pair enabled in this environment: `receive` (can it be credited) and `send` (can it move funds out), each `allowed`, `restricted` or `unknown`. Use it to explain a `recipient_transfer_restricted` error from charges_create. `pairs` is empty for a TRON address. The API key needs the `recipients:read` scope.",
          inputSchema: TransferabilityInputSchema,
          annotations: { readOnlyHint: true, openWorldHint: true },
        },
        ({ id }) =>
          runTool(environment, async () =>
            RecipientTransferabilitySchema.parse(await client.recipients.getTransferability(id)),
          ),
      )
    },
  },
]
