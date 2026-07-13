// Generated from backend/openapi.json by the API generation step. Do not edit DTOs by hand.
import { apiFetch, apiRequest } from './transport'
import type { components } from './openapi.generated'

type Strict<T, NullableKeys extends keyof T = never> = { [Key in keyof T]-?: Key extends NullableKeys ? T[Key] : NonNullable<T[Key]> }
export type ApiRole = components['schemas']['PracticeRole']
export type ApiPractice = Strict<components['schemas']['PracticeDto']>
export type ApiMe = Strict<components['schemas']['MeDto'], 'email' | 'displayName' | 'activePracticeId'>
export type ApiMember = Strict<components['schemas']['MemberDto'], 'email' | 'displayName'>
export type ApiInvitation = Strict<components['schemas']['InvitationDto']>
export type ApiFile = Strict<components['schemas']['FileDto']>
export type ApiFileAccess = Strict<Omit<components['schemas']['FileAccessDto'], 'file'>> & { file: ApiFile }
export type ApiPage = Strict<components['schemas']['PracticePageDto']>
export type ApiArticle = Strict<components['schemas']['ArticleDto'], 'headerUrl'>
export type ApiTag = Strict<components['schemas']['TagDto']>
export type ApiSearchResponse = Strict<components['schemas']['SearchResponseDto']>

const json = <T>(path: string, method: string, body?: unknown, headers?: Record<string, string>) => apiRequest<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body), headers })

export const generatedApi = {
  getMe: () => json<ApiMe>('/api/v1/me', 'GET'),
  setActivePractice: (practiceId: string | null) => json<ApiMe>('/api/v1/me/preferences/active-practice', 'PUT', { practiceId }),
  listPractices: () => json<ApiPractice[]>('/api/v1/practices', 'GET'),
  createPractice: (name: string, slug: string, idempotencyKey: string) => json<ApiPractice>('/api/v1/practices', 'POST', { name, slug }, { 'Idempotency-Key': idempotencyKey }),
  updatePractice: (practiceId: string, name: string, slug: string, version: string) => json<ApiPractice>(`/api/v1/practices/${practiceId}`, 'PUT', { name, slug }, { 'If-Match': `"${version}"` }),
  listMembers: (practiceId: string) => json<ApiMember[]>(`/api/v1/practices/${practiceId}/members`, 'GET'),
  listPracticeInvitations: (practiceId: string) => json<ApiInvitation[]>(`/api/v1/practices/${practiceId}/invitations`, 'GET'),
  invite: (practiceId: string, email: string, role: ApiRole) => json<ApiInvitation>(`/api/v1/practices/${practiceId}/invitations`, 'POST', { email, role }),
  updateMember: (practiceId: string, userId: string, role: ApiRole, version: string) => json<void>(`/api/v1/practices/${practiceId}/members/${userId}`, 'PATCH', { role }, { 'If-Match': `"${version}"` }),
  removeMember: (practiceId: string, userId: string) => json<void>(`/api/v1/practices/${practiceId}/members/${userId}`, 'DELETE'),
  transferOwnership: (practiceId: string, newOwnerId: string) => json<void>(`/api/v1/practices/${practiceId}/ownership-transfer`, 'POST', { newOwnerId }),
  listPendingInvitations: () => json<ApiInvitation[]>('/api/v1/invitations/pending', 'GET'),
  respondToInvitation: (invitationId: string, response: 'Accept' | 'Decline', idempotencyKey = crypto.randomUUID()) => json<ApiInvitation>(`/api/v1/invitations/${invitationId}/response`, 'POST', { response }, { 'Idempotency-Key': idempotencyKey }),
  listFiles: (practiceId: string) => json<ApiFile[]>(`/api/v1/practices/${practiceId}/files`, 'GET'),
  authorizeFileUpload: (practiceId: string, file: File) => json<ApiFileAccess>(`/api/v1/practices/${practiceId}/files/upload-authorization`, 'POST', { fileName: file.name, contentType: file.type || 'application/octet-stream', sizeBytes: file.size }),
  uploadFile: async (url: string, file: File) => { await apiFetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } }) },
  authorizeFileDownload: (practiceId: string, fileId: string) => json<ApiFileAccess>(`/api/v1/practices/${practiceId}/files/${fileId}/download-authorization`, 'GET'),
  downloadFile: async (url: string) => URL.createObjectURL(await (await apiFetch(url)).blob()),
  deleteFile: (practiceId: string, fileId: string) => json<void>(`/api/v1/practices/${practiceId}/files/${fileId}`, 'DELETE'),
  getPage: (practiceId: string, slug: string) => json<ApiPage>(`/api/v1/practices/${practiceId}/pages/${encodeURIComponent(slug)}`, 'GET'),
  createPage: (practiceId: string, slug: string, title: string, sections: Array<{ heading: string; documentJson: string }>) => json<ApiPage>(`/api/v1/practices/${practiceId}/pages/${encodeURIComponent(slug)}`, 'POST', { title, sections }),
  updatePage: (practiceId: string, slug: string, title: string, sections: Array<{ heading: string; documentJson: string }>, version: string) => json<ApiPage>(`/api/v1/practices/${practiceId}/pages/${encodeURIComponent(slug)}`, 'PUT', { title, sections }, { 'If-Match': `"${version}"` }),
  listArticles: () => json<ApiArticle[]>('/api/v1/articles', 'GET'),
  getArticle: (slug: string) => json<ApiArticle>(`/api/v1/articles/${encodeURIComponent(slug)}`, 'GET'),
  createArticle: (request: components['schemas']['ArticleRequest']) => json<ApiArticle>('/api/v1/articles', 'POST', request),
  updateArticle: (articleId: string, request: components['schemas']['ArticleRequest'], version: string) => json<ApiArticle>(`/api/v1/articles/${articleId}`, 'PUT', request, { 'If-Match': `"${version}"` }),
  deleteArticle: (articleId: string, version: string) => json<void>(`/api/v1/articles/${articleId}`, 'DELETE', undefined, { 'If-Match': `"${version}"` }),
  listTags: () => json<ApiTag[]>('/api/v1/tags', 'GET'),
  createTag: (name: string) => json<ApiTag>('/api/v1/tags', 'POST', { name }),
  updateTag: (tagId: string, name: string, version: string) => json<ApiTag>(`/api/v1/tags/${tagId}`, 'PUT', { name }, { 'If-Match': `"${version}"` }),
  search: (query: string, cursor?: string, pageSize = 10, practiceId?: string) => json<ApiSearchResponse>(`/api/v1/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}${practiceId ? `&practiceId=${encodeURIComponent(practiceId)}` : ''}`, 'GET'),
}
