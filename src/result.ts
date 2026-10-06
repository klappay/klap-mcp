import type { KlapEnvironment } from '@klappay/cli/credentials'
import { KlapApiError } from '@klappay/node'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { ZodError } from 'zod'

export const UNEXPECTED_ERROR_MESSAGE = 'Unexpected error calling the Klap API'
export const UNEXPECTED_RESPONSE_CODE = 'unexpected_response'
export const VALIDATION_ERROR_CODE = 'validation_error'

export type ToolPayload = Record<string, unknown>

export class ToolInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ToolInputError'
  }
}

function toResult(payload: ToolPayload, isError: boolean): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    ...(isError ? { isError: true } : {}),
  }
}

export function successResult(environment: KlapEnvironment, data: ToolPayload): CallToolResult {
  return toResult({ ...data, environment }, false)
}

function describeForLog(err: unknown): string {
  if (!(err instanceof Error)) return typeof err
  const cause =
    err.cause instanceof Error ? ` (cause: ${err.cause.name}: ${err.cause.message})` : ''
  return `${err.name}: ${err.message}${cause}`
}

function zodIssuePaths(err: ZodError): string {
  return err.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.code}`).join('; ')
}

export function errorResult(environment: KlapEnvironment, err: unknown): CallToolResult {
  if (err instanceof KlapApiError) {
    return toResult(
      { environment, error: { code: err.code, status: err.status, message: err.message } },
      true,
    )
  }
  if (err instanceof ToolInputError) {
    return toResult(
      { environment, error: { code: VALIDATION_ERROR_CODE, message: err.message } },
      true,
    )
  }
  if (err instanceof ZodError) {
    console.error(`klap-mcp: API response did not match the expected schema: ${zodIssuePaths(err)}`)
    return toResult(
      {
        environment,
        error: {
          code: UNEXPECTED_RESPONSE_CODE,
          message: 'The Klap API returned a response this server does not recognize.',
        },
      },
      true,
    )
  }
  console.error(`klap-mcp: ${UNEXPECTED_ERROR_MESSAGE}: ${describeForLog(err)}`)
  return toResult(
    { environment, error: { code: 'unexpected_error', message: UNEXPECTED_ERROR_MESSAGE } },
    true,
  )
}

export async function runTool(
  environment: KlapEnvironment,
  action: () => Promise<ToolPayload>,
): Promise<CallToolResult> {
  try {
    return successResult(environment, await action())
  } catch (err) {
    return errorResult(environment, err)
  }
}
