import { authInstance } from '../auth/firebase-auth'

export class ApiProblem extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly traceId?: string, public readonly validationErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiProblem'
  }
}

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let token: string | undefined
  try { token = await authInstance.currentUser?.getIdToken() }
  catch { throw new ApiProblem(401, 'auth.token_refresh_failed', 'Your session could not be refreshed. Sign in again.') }
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('X-Correlation-ID', crypto.randomUUID())

  const configuredTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15_000)
  const timeoutSignal = AbortSignal.timeout(Number.isFinite(configuredTimeout) ? configuredTimeout : 15_000)
  const signal = init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal
  let response: Response
  try { response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers, signal }) }
  catch {
    if (init.signal?.aborted) throw new ApiProblem(0, 'transport.aborted', 'The request was cancelled.')
    if (timeoutSignal.aborted) throw new ApiProblem(0, 'transport.timeout', 'The API request timed out.')
    throw new ApiProblem(0, 'transport.offline', 'The API is unavailable.', undefined, undefined)
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as { detail?: string; code?: string; traceId?: string; errors?: Record<string, string[]> }
    throw new ApiProblem(response.status, problem.code ?? 'server.request_failed', problem.detail ?? 'The request failed.', problem.traceId ?? response.headers.get('X-Correlation-ID') ?? undefined, problem.errors)
  }
  return response
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
