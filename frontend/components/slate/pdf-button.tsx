import { useContext } from 'react'
import { useSlate } from 'slate-react'
import { ArticleContext } from '../../containers/notes/notes.container'
import { useFileCenterModal } from '../../lib/hooks/files'

import { insertLink, isLinkActive, unwrapLink } from '../../lib/slate/utils'

import { BaseButton } from './base-button'
import { SlateIcon } from './icon.slate'

// @ts-ignore
export const LinkFileButton = () => {
  const editor = useSlate()
  const active = isLinkActive(editor, 'document')
  const anyLinkActive = isLinkActive(editor)

  const articleId = useContext(ArticleContext)

  const onSelectFile = (url: string) => {
    if (!url) return
    insertLink(editor, url, 'document')
  }
  const { showFileCenterModal } = useFileCenterModal(`/articles/${articleId}`, onSelectFile)

  return (
    <BaseButton
      active={active}
      disabled={!active && anyLinkActive}
      onMouseDown={(event: any) => {
        event.preventDefault()
        if (!active && anyLinkActive) return
        if (!active) {
          showFileCenterModal()
        }
        else {
          unwrapLink(editor, 'document')
        }
      }}
    >
      <SlateIcon iconType='link-document' active={active} />
    </BaseButton>
  )
}
