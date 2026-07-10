import { authInstance } from '../auth/firebase-auth'

export class ApiProblem extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly traceId?: string) {
    super(message)
    this.name = 'ApiProblem'
  }
}

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await authInstance.currentUser?.getIdToken()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('X-Correlation-ID', crypto.randomUUID())

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers, signal: init.signal })
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as { detail?: string; code?: string; traceId?: string }
    throw new ApiProblem(response.status, problem.code ?? 'server.request_failed', problem.detail ?? 'The request failed.', problem.traceId)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
