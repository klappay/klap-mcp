import { ChargeSchema, PaginatedChargesSchema } from '@klappay/types'
import { z } from 'zod'

export const ChargeWithoutMetadataSchema = ChargeSchema.omit({ metadata: true })

export const PaginatedChargesWithoutMetadataSchema = PaginatedChargesSchema.extend({
  data: z.array(ChargeWithoutMetadataSchema),
})
