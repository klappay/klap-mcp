import { MetricsQueryResultSchema, MetricsQuerySchema } from '@klappay/types'
import { z } from 'zod'
import { ToolInputError, runTool } from '../result'
import type { ToolDefinition } from './definition'

const [chargesQuery, transactionsQuery, distributionsQuery] = MetricsQuerySchema.innerType().options

const QueryWithoutEnvironmentSchema = z.discriminatedUnion('resource', [
  chargesQuery.omit({ environment: true }),
  transactionsQuery.omit({ environment: true }),
  distributionsQuery.omit({ environment: true }),
])

const MetricsQueryInputSchema = z
  .object({
    query: QueryWithoutEnvironmentSchema.describe(
      "The metrics query: a resource (charges, transactions or distributions), metrics to aggregate, an ISO 8601 dateRange, optional filters and groupBy. The environment is always this server's own and is filled in automatically.",
    ),
  })
  .strict()

export const metricsTools: ToolDefinition[] = [
  {
    name: 'metrics_query',
    access: 'read',
    register(server, { client, environment }) {
      server.registerTool(
        'metrics_query',
        {
          title: 'Query business metrics',
          description:
            "Run an aggregate query over this environment's charges, transactions or distributions (counts, sums, grouped by date bucket or dimension).",
          inputSchema: MetricsQueryInputSchema,
          annotations: { readOnlyHint: true, openWorldHint: true },
        },
        ({ query }) =>
          runTool(environment, async () => {
            const request = MetricsQuerySchema.safeParse({ ...query, environment })
            if (!request.success) throw ToolInputError.fromZod(request.error)
            return MetricsQueryResultSchema.parse(await client.metrics.query(request.data))
          }),
      )
    },
  },
]
