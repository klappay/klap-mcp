import { MetricsQueryResultSchema, MetricsQuerySchema } from '@klappay/types'
import { z } from 'zod'
import { runTool } from '../result'
import type { ToolDefinition } from './definition'

const MetricsQueryInputSchema = z
  .object({
    query: MetricsQuerySchema.describe(
      'The metrics query: a resource (charges, transactions or distributions), metrics to aggregate, an ISO 8601 dateRange, optional filters and groupBy.',
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
          runTool(environment, async () =>
            MetricsQueryResultSchema.parse(await client.metrics.query(query)),
          ),
      )
    },
  },
]
