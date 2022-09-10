import { useSlate } from 'slate-react'

import { insertLink, isLinkActive, unwrapLink } from '../../lib/slate/utils'

import { BaseButton } from './base-button'
import { SlateIcon } from './icon.slate'

// @ts-ignore
export const LinkButton = () => {
  const editor = useSlate()
  const active = isLinkActive(editor, 'external')
  const anyLinkActive = isLinkActive(editor)

  return (
    <BaseButton
      active={active}
      disabled={!active && anyLinkActive}
      onMouseDown={(event: any) => {
        event.preventDefault()

        if (!active && anyLinkActive) return

        if (!active) {
          const url = window.prompt('Enter the URL of the link:')
          if (!url) return
          insertLink(editor, url, 'external')
        }
        else {
          unwrapLink(editor, 'external')
        }
      }}
    >
      <SlateIcon iconType='link' active={active} />
    </BaseButton>
  )
}
