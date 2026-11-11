import { z } from 'zod'

export const ACTIVITY_ACTIONS = [
  'all',
  'loan_request.created',
  'loan_request.approved',
  'loan_request.rejected',
  'loan_request.cancelled',
  'loan_request.expired',
  'loan.checked_out',
  'loan.return_requested',
  'loan.checked_in',
  'loan.lost',
  'fine.created',
  'fine.paid',
  'fine.waived',
  'copy.created',
  'copy.status_changed',
  'book.deleted',
  'policy.updated',
  'setting.updated',
  'material.hidden',
  'material.shown',
  'member.created',
  'member.updated',
  'member.imported',
  'member.deactivated',
  'member.activated',
  'member.password_reset',
] as const

export const activityLogFilterSchema = z.object({
  action: z.string().catch('all'),
  officerId: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
  page: z.coerce.number().int().min(1).catch(1),
})

export type ActivityLogFilter = z.infer<typeof activityLogFilterSchema>
