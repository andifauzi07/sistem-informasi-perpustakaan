import type {
  MemberHistoryFilter,
  LibrarianRequestFilter,
  LibrarianLoanFilter,
} from '../schemas'

export const circulationKeys = {
  all: ['circulation'] as const,
  loanRequests: () => ['loan-requests'] as const,
  memberRequests: (memberId: string) => ['loan-requests', 'member', memberId] as const,
  librarianRequests: (filters: LibrarianRequestFilter) =>
    ['loan-requests', 'librarian', filters] as const,
  loans: () => ['loans'] as const,
  memberActiveLoans: (memberId: string) => ['loans', 'member-active', memberId] as const,
  memberHistory: (memberId: string, filters: MemberHistoryFilter) =>
    ['loans', 'member-history', memberId, filters] as const,
  memberCirculationSummary: (memberId: string) =>
    ['circulation', 'member-summary', memberId] as const,
  librarianLoans: (filters: LibrarianLoanFilter) =>
    ['loans', 'librarian', filters] as const,
  librarianReturnQueue: () => ['loans', 'return-queue'] as const,
  memberLookup: (code: string) => ['circulation', 'lookup-member', code] as const,
  copyLookup: (code: string) => ['circulation', 'lookup-copy', code] as const,
}
