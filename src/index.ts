import { SERVER_NAME } from './server-name'

console.log = console.error
console.info = console.error
console.debug = console.error

try {
  const { start } = await import('./start')
  await start()
} catch (err) {
  const name = err instanceof Error ? err.name : typeof err
  console.error(`${SERVER_NAME}: failed to start (${name}).`)
  process.exit(1)
}
