import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type KlapCredentialsConfig, loadCredentials } from '@klappay/cli/credentials'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ServerEnvironmentResult,
  type ServerEnvironmentVars,
  resolveServerEnvironment,
} from './environment'

const TEST_KEY = 'klap_test_s3cr3tTestKeyMaterial'
const LIVE_KEY = 'klap_live_s3cr3tLiveKeyMaterial'
const BASE_URL = 'https://api.example.test'

function configWith(apiKeys: KlapCredentialsConfig['apiKeys'], baseUrl = BASE_URL) {
  return async (): Promise<KlapCredentialsConfig | null> => ({ baseUrl, apiKeys })
}

const noConfig = async (): Promise<KlapCredentialsConfig | null> => null

const failIfLoaded = async (): Promise<KlapCredentialsConfig | null> => {
  throw new Error('config must not be loaded when KLAP_API_KEY is set')
}

function expectRefusal(result: ServerEnvironmentResult): string {
  if (result.ok) throw new Error(`expected a refusal, got ${result.environment}`)
  expect(result.message).not.toContain(TEST_KEY)
  expect(result.message).not.toContain(LIVE_KEY)
  expect(result.message).not.toContain('s3cr3t')
  return result.message
}

async function resolve(
  vars: ServerEnvironmentVars,
  loadConfig: () => Promise<KlapCredentialsConfig | null>,
) {
  return resolveServerEnvironment(vars, loadConfig)
}

describe('resolveServerEnvironment refusals', () => {
  it('refuses KLAP_ENV=live with a klap_test_ KLAP_API_KEY', async () => {
    const message = expectRefusal(
      await resolve(
        { KLAP_ENV: 'live', KLAP_API_KEY: TEST_KEY, KLAP_BASE_URL: BASE_URL },
        failIfLoaded,
      ),
    )
    expect(message).toMatch(/test key/)
  })

  it('refuses a klap_live_ KLAP_API_KEY when KLAP_ENV is unset (defaults to test)', async () => {
    expectRefusal(await resolve({ KLAP_API_KEY: LIVE_KEY, KLAP_BASE_URL: BASE_URL }, failIfLoaded))
  })

  it('refuses KLAP_ENV=live when the config only holds a test key', async () => {
    const message = expectRefusal(
      await resolve({ KLAP_ENV: 'live' }, configWith({ test: TEST_KEY })),
    )
    expect(message).toMatch(/no live key/)
  })

  it.each(['production', 'LIVE', ' live', 'live ', 'Test'])(
    'refuses KLAP_ENV=%j',
    async (value) => {
      const message = expectRefusal(
        await resolve({ KLAP_ENV: value }, configWith({ test: TEST_KEY, live: LIVE_KEY })),
      )
      expect(message).toMatch(/KLAP_ENV/)
    },
  )

  it('refuses a KLAP_API_KEY with an unknown prefix', async () => {
    const message = expectRefusal(
      await resolve({ KLAP_API_KEY: 'sk_s3cr3tWhatever', KLAP_BASE_URL: BASE_URL }, failIfLoaded),
    )
    expect(message).not.toContain('sk_s3cr3tWhatever')
  })

  it('refuses KLAP_API_KEY without KLAP_BASE_URL and never falls back to the config', async () => {
    const message = expectRefusal(await resolve({ KLAP_API_KEY: TEST_KEY }, failIfLoaded))
    expect(message).toMatch(/KLAP_BASE_URL/)
  })

  it('refuses a stored key combined with a different KLAP_BASE_URL', async () => {
    const message = expectRefusal(
      await resolve(
        { KLAP_BASE_URL: 'https://attacker.example.com' },
        configWith({ test: TEST_KEY }),
      ),
    )
    expect(message).toMatch(/only ever sent to the base URL it was saved with/)
  })

  it('refuses http:// for a non-loopback host', async () => {
    expectRefusal(
      await resolve(
        { KLAP_API_KEY: TEST_KEY, KLAP_BASE_URL: 'http://api.example.test' },
        failIfLoaded,
      ),
    )
    expectRefusal(await resolve({}, configWith({ test: TEST_KEY }, 'http://10.0.0.5:3000')))
  })

  it('refuses a base URL carrying a username or password, without echoing it', async () => {
    const message = expectRefusal(
      await resolve(
        { KLAP_API_KEY: TEST_KEY, KLAP_BASE_URL: 'https://user:hunter2@api.example.test' },
        failIfLoaded,
      ),
    )
    expect(message).not.toContain('hunter2')
    expectRefusal(
      await resolve({}, configWith({ test: TEST_KEY }, 'https://user@api.example.test')),
    )
  })

  it('refuses a live key sitting in the test slot of a loadConfig stub', async () => {
    const message = expectRefusal(await resolve({}, configWith({ test: LIVE_KEY })))
    expect(message).toMatch(/test slot/)
  })

  it('refuses when there is no config and no KLAP_API_KEY', async () => {
    const message = expectRefusal(await resolve({}, noConfig))
    expect(message).toContain('`klap login --api-key - --base-url <url>`')
    expect(message).toMatch(/KLAP_API_KEY/)
  })

  it('maps a thrown typed credentials error to a refusal', async () => {
    const message = expectRefusal(
      await resolve({}, async () => {
        const { InvalidCredentialsFileError } = await import('@klappay/cli/credentials')
        throw new InvalidCredentialsFileError()
      }),
    )
    expect(message).toMatch(/klap logout.*klap login/)
  })

  it('tells the user to remove a symlinked store before logging in', async () => {
    const message = expectRefusal(
      await resolve({}, async () => {
        const { SymlinkedCredentialsPathError } = await import('@klappay/cli/credentials')
        throw new SymlinkedCredentialsPathError()
      }),
    )
    expect(message).toMatch(/Remove the link/)
  })

  it('falls back to a generic refusal for a credentials error code it does not know', async () => {
    const message = expectRefusal(
      await resolve({}, async () => {
        const { KlapCredentialsError } = await import('@klappay/cli/credentials')
        const err = new KlapCredentialsError('no_credentials', 'unused')
        Object.defineProperty(err, 'code', { value: 'some_future_code' })
        throw err
      }),
    )
    expect(message).toBe(
      'Could not use ~/.klap/config.json (some_future_code). Run `klap logout`, then `klap login --api-key - --base-url <url>` again.',
    )
  })
})

describe('resolveServerEnvironment accepts', () => {
  it('treats empty-string vars as unset and resolves test from the config', async () => {
    const result = await resolve(
      { KLAP_ENV: '', KLAP_API_KEY: '', KLAP_BASE_URL: '', KLAP_MCP_ALLOW_LIVE_WRITES: '' },
      configWith({ test: TEST_KEY }),
    )
    expect(result).toEqual({
      ok: true,
      apiKey: TEST_KEY,
      baseUrl: BASE_URL,
      environment: 'test',
      allowLiveWrites: false,
      keySource: 'config',
    })
  })

  it('picks test when both keys are configured and KLAP_ENV is unset', async () => {
    const result = await resolve({}, configWith({ test: TEST_KEY, live: LIVE_KEY }))
    expect(result).toMatchObject({ ok: true, environment: 'test', apiKey: TEST_KEY })
  })

  it('uses the live key for KLAP_ENV=live', async () => {
    const result = await resolve(
      { KLAP_ENV: 'live' },
      configWith({ test: TEST_KEY, live: LIVE_KEY }),
    )
    expect(result).toMatchObject({ ok: true, environment: 'live', apiKey: LIVE_KEY })
  })

  it('accepts a KLAP_BASE_URL equal to the stored one up to a trailing slash', async () => {
    const result = await resolve({ KLAP_BASE_URL: `${BASE_URL}/` }, configWith({ test: TEST_KEY }))
    expect(result).toMatchObject({ ok: true, baseUrl: BASE_URL })
  })

  it.each(['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000'])(
    'accepts a test KLAP_API_KEY with loopback %s',
    async (baseUrl) => {
      const result = await resolve({ KLAP_API_KEY: TEST_KEY, KLAP_BASE_URL: baseUrl }, failIfLoaded)
      expect(result).toEqual({
        ok: true,
        apiKey: TEST_KEY,
        baseUrl,
        environment: 'test',
        allowLiveWrites: false,
        keySource: 'env',
      })
    },
  )

  it.each([
    ['1', true],
    ['true', false],
    ['yes', false],
    [' 1', false],
    ['0', false],
    [undefined, false],
  ])('KLAP_MCP_ALLOW_LIVE_WRITES=%j → allowLiveWrites %s', async (value, expected) => {
    const result = await resolve(
      { KLAP_ENV: 'live', KLAP_MCP_ALLOW_LIVE_WRITES: value },
      configWith({ live: LIVE_KEY }),
    )
    expect(result).toMatchObject({ ok: true, allowLiveWrites: expected })
  })
})

describe('resolveServerEnvironment with the real credentials store', () => {
  const originalHome = process.env.HOME
  let home: string

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), 'klap-mcp-home-'))
    process.env.HOME = home
  })

  afterEach(async () => {
    process.env.HOME = originalHome
    await rm(home, { recursive: true, force: true })
  })

  async function writeConfig(contents: unknown): Promise<void> {
    await mkdir(join(home, '.klap'), { mode: 0o700 })
    await writeFile(join(home, '.klap', 'config.json'), JSON.stringify(contents), { mode: 0o600 })
  }

  it('refuses when loadCredentials rejects a live key in the test slot', async () => {
    await writeConfig({ baseUrl: BASE_URL, apiKeys: { test: LIVE_KEY } })
    await expect(loadCredentials()).rejects.toMatchObject({ code: 'invalid_credentials_file' })
    const message = expectRefusal(await resolve({}, loadCredentials))
    expect(message).toMatch(/klap logout.*klap login/)
  })

  it('resolves a valid stored test key', async () => {
    await writeConfig({ baseUrl: BASE_URL, apiKeys: { test: TEST_KEY } })
    const result = await resolve({}, loadCredentials)
    expect(result).toMatchObject({ ok: true, environment: 'test', keySource: 'config' })
  })

  it('refuses when no credentials file exists', async () => {
    expectRefusal(await resolve({}, loadCredentials))
  })
})
