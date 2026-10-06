import { z } from 'zod'

const ID_BODY_MAX_LENGTH = 64

function prefixedIdSchema(prefix: string, label: string) {
  return z
    .string()
    .regex(
      new RegExp(`^${prefix}_[A-Za-z0-9]{1,${ID_BODY_MAX_LENGTH}}$`),
      `must be a ${label} id like ${prefix}_...`,
    )
    .describe(`A Klappay ${label} id (\`${prefix}_\` followed by letters and digits).`)
}

export const ChargeIdSchema = prefixedIdSchema('ch', 'charge')
export const WebhookIdSchema = prefixedIdSchema('wh', 'webhook')
export const WebhookDeliveryIdSchema = prefixedIdSchema('ev', 'webhook delivery')
