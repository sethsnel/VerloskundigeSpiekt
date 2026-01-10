export type ClipboardPayload = {
  text: string
  html?: string
}

const fallbackCopyText = (text: string): boolean => {
  if (!text || typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export const copyToClipboard = async ({ text, html }: ClipboardPayload): Promise<boolean> => {
  if (!text) {
    return false
  }

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const clipboardData: Record<string, Blob> = {
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }
      if (html) {
        clipboardData['text/html'] = new Blob([html], { type: 'text/html' })
      }
      await navigator.clipboard.write([new ClipboardItem(clipboardData)])
      return true
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    return fallbackCopyText(text)
  }

  return fallbackCopyText(text)
}
