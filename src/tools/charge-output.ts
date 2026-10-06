import { ChargeSchema } from '@klappay/types'

export const ChargeWithoutMetadataSchema = ChargeSchema.omit({ metadata: true })
