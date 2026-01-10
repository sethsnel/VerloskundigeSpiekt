'use client'

import { useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '@/lib/utils/clipboard'

type CopyInput = {
  text?: string
  html?: string
}

type UseCopyToClipboardOptions = {
  resetDelayMs?: number
}

type UseCopyToClipboardReturn = {
  copied: boolean
  contentRef: React.RefObject<HTMLDivElement | null>
  handleCopy: (override?: CopyInput) => Promise<boolean>
}

export const useCopyToClipboard = (
  options: UseCopyToClipboardOptions = {},
): UseCopyToClipboardReturn => {
  const { resetDelayMs = 1500 } = options
  const [copied, setCopied] = useState<boolean>(false)
  const copyTimeoutRef = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async (override?: CopyInput) => {
    const overrideText = override?.text?.trim() ?? ''
    const overrideHtml = override?.html?.trim() ?? ''
    const renderedText = contentRef.current?.textContent?.trim() ?? ''
    const renderedHtml = contentRef.current?.innerHTML?.trim() ?? ''
    const textToCopy = overrideText || renderedText
    const htmlToCopy = overrideHtml || renderedHtml

    if (!textToCopy) {
      return false
    }

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current)
    }

    const copiedSuccessfully = await copyToClipboard({ text: textToCopy, html: htmlToCopy })
    if (copiedSuccessfully) {
      setCopied(true)
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), resetDelayMs)
    }

    return copiedSuccessfully
  }

  return { copied, contentRef, handleCopy }
}
