import { describe, expect, it } from 'vitest'
import { REDACTED_URL, hostOf, redactUrl } from './redact'

describe('redactUrl', () => {
  it('drops userinfo, query string and fragment, keeping origin and path', () => {
    expect(redactUrl('https://user:p4ss@hooks.example.com:8443/klap/in?token=abc#frag')).toBe(
      'https://hooks.example.com:8443/klap/in',
    )
  })

  it('drops a token-only userinfo', () => {
    expect(redactUrl('https://tok3n@hooks.example.com/x')).toBe('https://hooks.example.com/x')
  })

  it('keeps a plain URL unchanged', () => {
    expect(redactUrl('https://hooks.example.com/klap')).toBe('https://hooks.example.com/klap')
  })

  it('returns a placeholder instead of echoing an unparseable value', () => {
    expect(redactUrl('not a url ?secret=1')).toBe(REDACTED_URL)
  })

  it('returns a placeholder for a URL with no real origin', () => {
    expect(redactUrl('data:text/plain,secret')).toBe(REDACTED_URL)
  })
})

describe('hostOf', () => {
  it('returns host and port only', () => {
    expect(hostOf('https://user:pw@api.example.com:8443/base?x=1')).toBe('api.example.com:8443')
  })
})
