import { afterEach, describe, expect, test, vi } from 'vitest'

const { getIdToken } = vi.hoisted(() => ({ getIdToken: vi.fn<() => Promise<string>>() }))
getIdToken.mockResolvedValue('synthetic-token')
vi.mock('../../lib/auth/firebase-auth', () => ({ authInstance: { currentUser: { getIdToken } } }))

import { ApiProblem, apiFetch } from '../../lib/api/transport'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  getIdToken.mockReset()
  getIdToken.mockResolvedValue('synthetic-token')
})

describe('API transport failure contract', () => {
  test.each([401, 403, 409, 429, 500])('preserves Problem Details for HTTP %i', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: `test.${status}`, detail: 'Synthetic failure', traceId: 'trace-1', errors: { field: ['invalid'] } }), { status, headers: { 'Content-Type': 'application/problem+json' } })))
    const failure = await apiFetch('/test').catch(error => error as ApiProblem)
    expect(failure).toMatchObject({ status, code: `test.${status}`, message: 'Synthetic failure', traceId: 'trace-1', validationErrors: { field: ['invalid'] } })
  })

  test('maps token refresh failures to a stable reauthentication problem', async () => {
    getIdToken.mockRejectedValueOnce(new Error('revoked'))
    const failure = await apiFetch('/test').catch(error => error as ApiProblem)
    expect(failure).toMatchObject({ status: 401, code: 'auth.token_refresh_failed' })
  })

  test('maps offline and caller-aborted requests separately', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(apiFetch('/test')).rejects.toMatchObject({ code: 'transport.offline' })

    const controller = new AbortController()
    controller.abort()
    await expect(apiFetch('/test', { signal: controller.signal })).rejects.toMatchObject({ code: 'transport.aborted' })
  })

  test('enforces the configured request timeout', async () => {
    const previous = process.env.NEXT_PUBLIC_API_TIMEOUT_MS
    process.env.NEXT_PUBLIC_API_TIMEOUT_MS = '1'
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError'))))))
    await expect(apiFetch('/test')).rejects.toMatchObject({ code: 'transport.timeout' })
    process.env.NEXT_PUBLIC_API_TIMEOUT_MS = previous
  })

  test('adds bearer and bounded correlation headers to API requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await apiFetch('/test')
    const request = fetchMock.mock.calls[0][1] as RequestInit
    const headers = request.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer synthetic-token')
    expect(headers.get('X-Correlation-ID')).toMatch(/^[0-9a-f-]{36}$/)
    expect(request.signal).toBeInstanceOf(AbortSignal)
  })
})
