// Generated from backend/openapi.json by the API generation step. Do not edit DTOs by hand.
import { apiRequest } from './transport'

export type ApiRole = 'Member' | 'Administrator' | 'Owner'
export type ApiPractice = { id: string; name: string; slug: string; role: ApiRole; createdAt: string; version: string }
export type ApiMe = { id: string; externalSubject: string; email: string | null; displayName: string | null; emailVerified: boolean; activePracticeId: string | null }
export type ApiMember = { userId: string; email: string | null; displayName: string | null; role: ApiRole; version: string }
export type ApiInvitation = { id: string; practiceId: string; email: string; role: ApiRole; status: 'Pending' | 'Accepted' | 'Declined' | 'Revoked' | 'Expired'; expiresAt: string; version: string }

const json = <T>(path: string, method: string, body?: unknown, headers?: Record<string, string>) => apiRequest<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body), headers })

export const generatedApi = {
  getMe: () => json<ApiMe>('/api/v1/me', 'GET'),
  setActivePractice: (practiceId: string | null) => json<ApiMe>('/api/v1/me/preferences/active-practice', 'PUT', { practiceId }),
  listPractices: () => json<ApiPractice[]>('/api/v1/practices', 'GET'),
  createPractice: (name: string, slug: string, idempotencyKey: string) => json<ApiPractice>('/api/v1/practices', 'POST', { name, slug }, { 'Idempotency-Key': idempotencyKey }),
  updatePractice: (practiceId: string, name: string, slug: string, version?: string) => json<ApiPractice>(`/api/v1/practices/${practiceId}`, 'PUT', { name, slug }, version ? { 'If-Match': version } : undefined),
  listMembers: (practiceId: string) => json<ApiMember[]>(`/api/v1/practices/${practiceId}/members`, 'GET'),
  listPracticeInvitations: (practiceId: string) => json<ApiInvitation[]>(`/api/v1/practices/${practiceId}/invitations`, 'GET'),
  invite: (practiceId: string, email: string, role: ApiRole) => json<ApiInvitation>(`/api/v1/practices/${practiceId}/invitations`, 'POST', { email, role }),
  updateMember: (practiceId: string, userId: string, role: ApiRole, version?: string) => json<void>(`/api/v1/practices/${practiceId}/members/${userId}`, 'PATCH', { role }, version ? { 'If-Match': version } : undefined),
  removeMember: (practiceId: string, userId: string) => json<void>(`/api/v1/practices/${practiceId}/members/${userId}`, 'DELETE'),
  transferOwnership: (practiceId: string, newOwnerId: string) => json<void>(`/api/v1/practices/${practiceId}/ownership-transfer`, 'POST', { newOwnerId }),
  listPendingInvitations: () => json<ApiInvitation[]>('/api/v1/invitations/pending', 'GET'),
  respondToInvitation: (invitationId: string, response: 'Accept' | 'Decline') => json<ApiInvitation>(`/api/v1/invitations/${invitationId}/response`, 'POST', { response }),
}
