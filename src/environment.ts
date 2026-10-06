import {
  CREDENTIALS_DISPLAY_PATH,
  type KlapCredentialsConfig,
  KlapCredentialsError,
  type KlapCredentialsErrorCode,
  type KlapEnvironment,
  detectEnvironment,
} from '@klappay/cli/credentials'

export type ServerEnvironmentVars = {
  KLAP_ENV?: string
  KLAP_API_KEY?: string
  KLAP_BASE_URL?: string
  KLAP_MCP_ALLOW_LIVE_WRITES?: string
}

export type KeySource = 'env' | 'config'

export type ResolvedServerEnvironment = {
  ok: true
  apiKey: string
  baseUrl: string
  environment: KlapEnvironment
  allowLiveWrites: boolean
  keySource: KeySource
}

export type ServerEnvironmentRefusal = { ok: false; message: string }

export type ServerEnvironmentResult = ResolvedServerEnvironment | ServerEnvironmentRefusal

export type LoadCredentialsConfig = () => Promise<KlapCredentialsConfig | null>

const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]']
const LIVE_WRITES_ENABLED_VALUE = '1'
const LOGIN_COMMAND = '`klap login --api-key - --base-url <url>`'
const LOGIN_HINT = `Run ${LOGIN_COMMAND} (from @klappay/cli) or set KLAP_API_KEY and KLAP_BASE_URL.`

const CREDENTIALS_ERROR_MESSAGES: Record<KlapCredentialsErrorCode, string> = {
  invalid_api_key_prefix: `A key in ${CREDENTIALS_DISPLAY_PATH} does not start with klap_test_ or klap_live_. Run ${LOGIN_COMMAND} again.`,
  invalid_credentials_file: `${CREDENTIALS_DISPLAY_PATH} is corrupted or has a key in the wrong environment slot. Run \`klap logout\` to remove it, then ${LOGIN_COMMAND} again.`,
  credentials_path_symlink: `Refusing to read ${CREDENTIALS_DISPLAY_PATH}: it (or ~/.klap) is a symbolic link. Remove the link, then run ${LOGIN_COMMAND} to create a real ~/.klap directory.`,
  no_credentials: `No API key in ${CREDENTIALS_DISPLAY_PATH}. ${LOGIN_HINT}`,
  missing_environment_key: `${CREDENTIALS_DISPLAY_PATH} has no key for the requested environment. Run ${LOGIN_COMMAND} with that key, or change KLAP_ENV.`,
  ambiguous_environment: `${CREDENTIALS_DISPLAY_PATH} has keys for both environments; set KLAP_ENV to test or live.`,
}

function credentialsErrorMessage(err: KlapCredentialsError): string {
  if (Object.hasOwn(CREDENTIALS_ERROR_MESSAGES, err.code))
    return CREDENTIALS_ERROR_MESSAGES[err.code]
  return `Could not use ${CREDENTIALS_DISPLAY_PATH} (${err.code}). Run \`klap logout\`, then ${LOGIN_COMMAND} again.`
}

function refuse(message: string): ServerEnvironmentRefusal {
  return { ok: false, message }
}

function presentValue(value: string | undefined): string | undefined {
  return value === undefined || value === '' ? undefined : value
}

function parseEnvironment(value: string | undefined): KlapEnvironment | null {
  if (value === undefined) return 'test'
  if (value === 'test' || value === 'live') return value
  return null
}

function keyEnvironment(apiKey: string): KlapEnvironment | null {
  try {
    return detectEnvironment(apiKey)
  } catch {
    return null
  }
}

function baseUrlProblem(value: string, label: string): string | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return `${label} is not a valid URL.`
  }
  if (url.username !== '' || url.password !== '') {
    return `${label} must not contain a username or password.`
  }
  if (url.protocol === 'https:') return null
  if (url.protocol === 'http:' && LOOPBACK_HOSTNAMES.includes(url.hostname)) return null
  return `${label} must use https:// (http:// is only allowed for localhost, 127.0.0.1 or [::1]).`
}

function normalizedBaseUrl(value: string): string {
  const url = new URL(value)
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
}

function keyMismatchMessage(source: string, keyEnv: KlapEnvironment, wanted: KlapEnvironment) {
  return `${source} is a ${keyEnv} key, but the server is set to ${wanted} (KLAP_ENV${wanted === 'test' ? ' unset or test' : '=live'}). Refusing to start.`
}

function resolveFromEnvKey(
  apiKey: string,
  baseUrl: string | undefined,
  environment: KlapEnvironment,
  allowLiveWrites: boolean,
): ServerEnvironmentResult {
  if (baseUrl === undefined) {
    return refuse('KLAP_API_KEY is set but KLAP_BASE_URL is not; set both.')
  }
  const urlProblem = baseUrlProblem(baseUrl, 'KLAP_BASE_URL')
  if (urlProblem) return refuse(urlProblem)

  const keyEnv = keyEnvironment(apiKey)
  if (keyEnv === null) return refuse('KLAP_API_KEY must start with klap_test_ or klap_live_.')
  if (keyEnv !== environment) return refuse(keyMismatchMessage('KLAP_API_KEY', keyEnv, environment))

  return { ok: true, apiKey, baseUrl, environment, allowLiveWrites, keySource: 'env' }
}

async function loadConfigOrRefusal(
  loadConfig: LoadCredentialsConfig,
): Promise<KlapCredentialsConfig | ServerEnvironmentRefusal> {
  try {
    const config = await loadConfig()
    return config ?? refuse(`No ${CREDENTIALS_DISPLAY_PATH} found. ${LOGIN_HINT}`)
  } catch (err) {
    if (err instanceof KlapCredentialsError) return refuse(credentialsErrorMessage(err))
    const code = err instanceof Error && 'code' in err ? String(err.code) : 'unknown error'
    return refuse(`Could not read ${CREDENTIALS_DISPLAY_PATH} (${code}).`)
  }
}

async function resolveFromConfig(
  loadConfig: LoadCredentialsConfig,
  overrideBaseUrl: string | undefined,
  environment: KlapEnvironment,
  allowLiveWrites: boolean,
): Promise<ServerEnvironmentResult> {
  const loaded = await loadConfigOrRefusal(loadConfig)
  if ('ok' in loaded) return loaded

  const apiKey = loaded.apiKeys[environment]
  if (apiKey === undefined || apiKey === '') {
    return refuse(
      `${CREDENTIALS_DISPLAY_PATH} has no ${environment} key. Run ${LOGIN_COMMAND} with a klap_${environment}_ key, or set KLAP_ENV to the environment you have a key for.`,
    )
  }
  const keyEnv = keyEnvironment(apiKey)
  if (keyEnv !== environment) {
    return refuse(
      `The ${environment} slot in ${CREDENTIALS_DISPLAY_PATH} does not hold a klap_${environment}_ key. Run ${LOGIN_COMMAND} again.`,
    )
  }

  const urlProblem = baseUrlProblem(loaded.baseUrl, `The baseUrl in ${CREDENTIALS_DISPLAY_PATH}`)
  if (urlProblem) return refuse(urlProblem)

  if (overrideBaseUrl !== undefined) {
    const overrideProblem = baseUrlProblem(overrideBaseUrl, 'KLAP_BASE_URL')
    if (overrideProblem) return refuse(overrideProblem)
    if (normalizedBaseUrl(overrideBaseUrl) !== normalizedBaseUrl(loaded.baseUrl)) {
      return refuse(
        `KLAP_BASE_URL differs from the baseUrl stored in ${CREDENTIALS_DISPLAY_PATH}. A stored key is only ever sent to the base URL it was saved with — unset KLAP_BASE_URL, or set KLAP_API_KEY together with KLAP_BASE_URL instead.`,
      )
    }
  }

  return {
    ok: true,
    apiKey,
    baseUrl: loaded.baseUrl,
    environment,
    allowLiveWrites,
    keySource: 'config',
  }
}

export async function resolveServerEnvironment(
  vars: ServerEnvironmentVars,
  loadConfig: LoadCredentialsConfig,
): Promise<ServerEnvironmentResult> {
  const environment = parseEnvironment(presentValue(vars.KLAP_ENV))
  if (environment === null) return refuse('KLAP_ENV must be unset, "test" or "live".')

  const allowLiveWrites = vars.KLAP_MCP_ALLOW_LIVE_WRITES === LIVE_WRITES_ENABLED_VALUE
  const apiKey = presentValue(vars.KLAP_API_KEY)
  const baseUrl = presentValue(vars.KLAP_BASE_URL)

  if (apiKey !== undefined) {
    return resolveFromEnvKey(apiKey, baseUrl, environment, allowLiveWrites)
  }
  return resolveFromConfig(loadConfig, baseUrl, environment, allowLiveWrites)
}
