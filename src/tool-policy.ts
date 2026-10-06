import type { KlapEnvironment } from '@klappay/cli/credentials'
import type { ToolAccess } from './tools/definition'

export function isToolAllowed(
  access: ToolAccess,
  environment: KlapEnvironment,
  allowLiveWrites: boolean,
): boolean {
  if (environment === 'test') return true
  if (access === 'read') return true
  if (access === 'write') return allowLiveWrites
  return false
}
