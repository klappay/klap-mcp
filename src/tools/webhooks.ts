import {
  ListWebhookDeliveriesSchema,
  PaginatedWebhookDeliveriesSchema,
  WebhookListItemSchema,
} from '@klappay/types'
import { z } from 'zod'
import { WebhookDeliveryIdSchema, WebhookIdSchema } from '../ids'
import { redactUrl } from '../redact'
import { runTool } from '../result'
import type { ToolDefinition } from './definition'

const WebhookListSchema = z.array(WebhookListItemSchema)

const ListDeliveriesInputSchema = ListWebhookDeliveriesSchema.extend({
  webhookId: WebhookIdSchema,
}).strict()

const RetryDeliveryInputSchema = z
  .object({ webhookId: WebhookIdSchema, deliveryId: WebhookDeliveryIdSchema })
  .strict()

export const webhookTools: ToolDefinition[] = [
  {
    name: 'webhooks_list',
    access: 'read',
    register(server, { client, environment }) {
      server.registerTool(
        'webhooks_list',
        {
          title: 'List webhooks',
          description:
            'List webhook endpoints and the events they subscribe to. Endpoint URLs are shown as origin + path only (credentials and query strings removed); secrets are never returned, only their display hint.',
          annotations: { readOnlyHint: true, openWorldHint: true },
        },
        () =>
          runTool(environment, async () => {
            const webhooks = WebhookListSchema.parse(await client.webhooks.list())
            return {
              webhooks: webhooks.map((webhook) => ({ ...webhook, url: redactUrl(webhook.url) })),
            }
          }),
      )
    },
  },
  {
    name: 'webhooks_list_deliveries',
    access: 'read',
    register(server, { client, environment }) {
      server.registerTool(
        'webhooks_list_deliveries',
        {
          title: 'List webhook deliveries',
          description:
            "List one webhook's delivery attempts (event, status, attempts, response code), newest first. Paginate with limit and the previous page's nextCursor.",
          inputSchema: ListDeliveriesInputSchema,
          annotations: { readOnlyHint: true, openWorldHint: true },
        },
        ({ webhookId, ...page }) =>
          runTool(environment, async () => {
            const deliveries = await client.webhooks.listDeliveries(webhookId, page)
            return { webhookId, ...PaginatedWebhookDeliveriesSchema.parse(deliveries) }
          }),
      )
    },
  },
  {
    name: 'webhooks_retry_delivery',
    access: 'write',
    register(server, { client, environment }) {
      server.registerTool(
        'webhooks_retry_delivery',
        {
          title: 'Retry webhook delivery',
          description:
            'Re-send one past webhook delivery to its endpoint now. The receiving system will process the event again.',
          inputSchema: RetryDeliveryInputSchema,
          annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: true,
          },
        },
        ({ webhookId, deliveryId }) =>
          runTool(environment, async () => {
            await client.webhooks.retryDelivery(webhookId, deliveryId)
            return { webhookId, deliveryId, retried: true }
          }),
      )
    },
  },
]
