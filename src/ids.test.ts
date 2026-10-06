import { describe, expect, it } from 'vitest'
import { ChargeIdSchema, WebhookDeliveryIdSchema, WebhookIdSchema } from './ids'

describe('id schemas', () => {
  it.each(['ch_abc123', 'ch_tz4a98xxat96iws9zmbrgj3a'])('accepts charge id %j', (id) => {
    expect(ChargeIdSchema.safeParse(id).success).toBe(true)
  })

  it.each([
    '.',
    '..',
    'ch_..',
    'ch_abc/../x',
    'ch_abc/def',
    'ch_ abc',
    'ch_abc\n',
    'ch_',
    'wh_abc123',
    'ch_abc?x=1',
    'ch_abc#x',
    'ch_abc%2F',
    `ch_${'a'.repeat(65)}`,
  ])('rejects charge id %j', (id) => {
    expect(ChargeIdSchema.safeParse(id).success).toBe(false)
  })

  it('binds each schema to its own prefix', () => {
    expect(WebhookIdSchema.safeParse('wh_abc').success).toBe(true)
    expect(WebhookIdSchema.safeParse('ev_abc').success).toBe(false)
    expect(WebhookDeliveryIdSchema.safeParse('ev_abc').success).toBe(true)
    expect(WebhookDeliveryIdSchema.safeParse('wh_abc').success).toBe(false)
  })
})
