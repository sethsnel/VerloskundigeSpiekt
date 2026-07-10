export type PublishedTemplate = { id: string; key: string; name: string; definitionJson: string; status: 'Published' }

export async function listPublishedTemplates(apiBaseUrl: string, token: string, practiceId: string, signal?: AbortSignal): Promise<PublishedTemplate[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/practices/${encodeURIComponent(practiceId)}/templates/published`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, signal,
  })
  if (!response.ok) throw new Error(`Template request failed: ${response.status}`)
  return response.json() as Promise<PublishedTemplate[]>
}

export function substituteLocally(definitionJson: string, values: Readonly<Record<string, string>>): string {
  const definition = JSON.parse(definitionJson) as unknown
  if (!definition || typeof definition !== 'object') throw new Error('Invalid template definition')
  const serialized = JSON.stringify(definition)
  return serialized.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Missing template value: ${key}`)
    return values[key]
  })
}
