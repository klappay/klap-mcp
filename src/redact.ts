export const REDACTED_URL = '[unparseable url]'

export function redactUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return REDACTED_URL
  }
  if (url.origin === 'null') return REDACTED_URL
  return `${url.origin}${url.pathname}`
}

export function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host
  } catch {
    return REDACTED_URL
  }
}
