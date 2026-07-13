export async function listPublishedTemplates(apiBaseUrl, token, practiceId, signal) {
  const response = await fetch(`${apiBaseUrl}/api/v1/practices/${encodeURIComponent(practiceId)}/templates/published`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, signal })
  if (!response.ok) throw Object.assign(new Error(`Template request failed: ${response.status}`), { status: response.status })
  return response.json()
}

export async function getPublishedTemplate(apiBaseUrl, token, practiceId, key, signal) {
  const response = await fetch(`${apiBaseUrl}/api/v1/practices/${encodeURIComponent(practiceId)}/templates/published/${encodeURIComponent(key)}`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, signal })
  if (!response.ok) throw Object.assign(new Error(`Template request failed: ${response.status}`), { status: response.status })
  return response.json()
}

export function substituteLocally(definitionJson, values) {
  const definition = JSON.parse(definitionJson)
  if (!definition || definition.version !== 1 || !Array.isArray(definition.subject) || !Array.isArray(definition.body)) throw new Error('Invalid template definition')
  const substitute = segments => segments.map(segment => {
    if (segment?.type === 'text' && typeof segment.value === 'string') return { type: 'text', value: segment.value }
    if (segment?.type === 'placeholder' && typeof segment.key === 'string' && Object.prototype.hasOwnProperty.call(values, segment.key)) return { type: 'text', value: values[segment.key] }
    throw new Error(segment?.type === 'placeholder' ? `Missing template value: ${segment.key}` : 'Invalid template segment')
  })
  return JSON.stringify({ version: 1, subject: substitute(definition.subject), body: substitute(definition.body) })
}
