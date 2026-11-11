import type { ReportFilter } from '../schemas'

export const reportKeys = {
  all: ['reports'] as const,
  data: (filter: ReportFilter) => ['reports', filter.type, filter.from, filter.to] as const,
}
