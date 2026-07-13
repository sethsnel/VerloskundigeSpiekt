import { getPublishedTemplate, listPublishedTemplates } from './template-client.js'

const session = chrome.storage.session
const local = chrome.storage.local

async function configuration() {
  const value = await local.get(['apiBaseUrl', 'firebaseApiKey'])
  return { apiBaseUrl: value.apiBaseUrl || 'https://api.verloskundigespiekt.nl', firebaseApiKey: value.firebaseApiKey }
}

async function authenticate(email, password) {
  const { firebaseApiKey } = await configuration()
  if (!firebaseApiKey) throw new Error('Configure the Firebase API key first.')
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(firebaseApiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) })
  if (!response.ok) throw new Error('Authentication failed.')
  const token = await response.json(); await session.set({ auth: { idToken: token.idToken, refreshToken: token.refreshToken, expiresAt: Date.now() + Number(token.expiresIn) * 1000 } })
}

async function bearerToken() {
  const stored = (await session.get('auth')).auth
  if (!stored) throw Object.assign(new Error('Sign in is required.'), { status: 401 })
  if (stored.expiresAt > Date.now() + 60_000) return stored.idToken
  const { firebaseApiKey } = await configuration()
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(firebaseApiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: stored.refreshToken }) })
  if (!response.ok) { await session.remove('auth'); throw Object.assign(new Error('Your session expired. Sign in again.'), { status: 401 }) }
  const token = await response.json(); await session.set({ auth: { idToken: token.id_token, refreshToken: token.refresh_token, expiresAt: Date.now() + Number(token.expires_in) * 1000 } }); return token.id_token
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    try {
      if (message.type === 'configure') await local.set({ apiBaseUrl: message.apiBaseUrl, firebaseApiKey: message.firebaseApiKey })
      else if (message.type === 'login') await authenticate(message.email, message.password)
      else if (message.type === 'logout') await session.remove('auth')
      else {
        const config = await configuration(); const token = await bearerToken(); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15_000)
        try {
          if (message.type === 'listTemplates') sendResponse({ ok: true, value: await listPublishedTemplates(config.apiBaseUrl, token, message.practiceId, controller.signal) })
          else if (message.type === 'getTemplate') sendResponse({ ok: true, value: await getPublishedTemplate(config.apiBaseUrl, token, message.practiceId, message.key, controller.signal) })
          else throw new Error('Unsupported operation.')
        } finally { clearTimeout(timeout) }
        return
      }
      sendResponse({ ok: true })
    } catch (error) { sendResponse({ ok: false, status: error?.status, message: error instanceof Error ? error.message : 'Request failed.' }) }
  })()
  return true
})
