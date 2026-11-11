export const settingsKeys = {
  all: ['settings'] as const,
  profile: () => ['settings', 'profile'] as const,
  policies: () => ['settings', 'policies'] as const,
  majors: () => ['settings', 'majors'] as const,
}
