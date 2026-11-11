import type { ActivityLogFilter } from '../schemas'

export const activityLogKeys = {
  all: ['activity-logs'] as const,
  list: (filter: ActivityLogFilter) => ['activity-logs', 'list', filter] as const,
  officers: () => ['activity-logs', 'officers'] as const,
}
