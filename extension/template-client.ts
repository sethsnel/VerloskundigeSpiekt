export type PublishedTemplate = { id: string; key: string; name: string; definitionJson: string; status: 'Published' }

export async function listPublishedTemplates(apiBaseUrl: string, token: string, practiceId: string, signal?: AbortSignal): Promise<PublishedTemplate[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/practices/${encodeURIComponent(practiceId)}/templates/published`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, signal,
  })
  if (!response.ok) throw new Error(`Template request failed: ${response.status}`)
  return response.json() as Promise<PublishedTemplate[]>
}

export function substituteLocally(definitionJson: string, values: Readonly<Record<string, string>>): string {
  const definition = JSON.parse(definitionJson) as { version?: unknown; subject?: unknown; body?: unknown }
  if (!definition || definition.version !== 1 || !Array.isArray(definition.subject) || !Array.isArray(definition.body)) throw new Error('Invalid template definition')
  const substitute = (segments: unknown[]) => segments.map(segment => {
    if (!segment || typeof segment !== 'object' || Array.isArray(segment)) throw new Error('Invalid template segment')
    const candidate = segment as Record<string, unknown>
    if (candidate.type === 'text' && typeof candidate.value === 'string') return { type: 'text', value: candidate.value }
    if (candidate.type === 'placeholder' && typeof candidate.key === 'string') {
      if (!Object.prototype.hasOwnProperty.call(values, candidate.key)) throw new Error(`Missing template value: ${candidate.key}`)
      return { type: 'text', value: values[candidate.key] }
    }
    throw new Error('Invalid template segment')
  })
  return JSON.stringify({ version: 1, subject: substitute(definition.subject), body: substitute(definition.body) })
}
