export const apiQueryKeys = {
  me: (userId?: string) => ['api', 'me', userId] as const,
  practices: (userId?: string) => ['api', 'practices', userId] as const,
  activePractice: (userId?: string) => ['api', 'active-practice', userId] as const,
  members: (userId?: string, practiceId?: string) => ['api', 'members', userId, practiceId] as const,
  invitations: (userId?: string, practiceId?: string) => ['api', 'invitations', userId, practiceId] as const,
}
