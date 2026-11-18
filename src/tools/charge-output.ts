import { ChargeSchema, PaginatedChargesSchema } from '@klappay/types'
import { z } from 'zod'

export const CHARGE_AMOUNTS_NOTE =
  '`amount` is what the payer sends and includes `gasFeeAmount`; `requestedAmount` is what the merchant asked for.'

export const ChargeWithoutMetadataSchema = ChargeSchema.omit({ metadata: true })

export const PaginatedChargesWithoutMetadataSchema = PaginatedChargesSchema.extend({
  data: z.array(ChargeWithoutMetadataSchema),
})
