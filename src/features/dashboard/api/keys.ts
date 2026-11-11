export const dashboardKeys = {
  all: ['dashboard'] as const,
  librarian: () => ['dashboard', 'librarian'] as const,
  member: (memberId: string, role: string) => ['dashboard', 'member', memberId, role] as const,
}
