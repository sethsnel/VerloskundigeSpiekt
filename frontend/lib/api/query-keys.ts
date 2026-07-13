import type { QueryClient, QueryKey } from 'react-query'

export const apiQueryKeys = {
  me: (userId?: string) => ['api', 'me', userId] as const,
  practices: (userId?: string) => ['api', 'practices', userId] as const,
  activePractice: (userId?: string) => ['api', 'active-practice', userId] as const,
  members: (userId?: string, practiceId?: string) => ['api', 'members', userId, practiceId] as const,
  invitations: (userId?: string, practiceId?: string) => ['api', 'invitations', userId, practiceId] as const,
  pages: (userId?: string, practiceId?: string) => ['api', 'pages', userId, practiceId] as const,
  templates: (userId?: string, practiceId?: string) => ['api', 'templates', userId, practiceId] as const,
  contacts: (userId?: string, practiceId?: string) => ['api', 'contacts', userId, practiceId] as const,
  files: (userId?: string, practiceId?: string, path?: string) => ['api', 'files', userId, practiceId, path] as const,
  privateSearch: (userId?: string, practiceId?: string, query?: string) => ['api', 'private-search', userId, practiceId, query] as const,
}

const tenantScopes = new Set(['members', 'invitations', 'pages', 'templates', 'contacts', 'files', 'private-search'])
export const isTenantQuery = (queryKey: QueryKey) => Array.isArray(queryKey) && queryKey[0] === 'api' && tenantScopes.has(String(queryKey[1]))
export const clearTenantQueries = async (queryClient: QueryClient) => {
  await queryClient.cancelQueries({ predicate: query => isTenantQuery(query.queryKey) })
  queryClient.removeQueries({ predicate: query => isTenantQuery(query.queryKey) })
}
