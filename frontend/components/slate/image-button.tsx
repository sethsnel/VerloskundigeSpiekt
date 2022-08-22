import { useContext } from 'react'
import { useSlate } from 'slate-react'
import { ArticleContext } from '../../containers/notes/notes.container'
import { useFileCenterModal } from '../../lib/hooks/fileCenterModal'

import { insertImage, isImageActive, deleteImage } from '../../lib/slate/utils'

import { BaseButton } from './base-button'
import { SlateIcon } from './icon.slate'

// @ts-ignore
export const ImageButton = ({ elementPath }: { elementPath?: string }) => {
  const editor = useSlate()

  const active = isImageActive(editor)
  const articleId = useContext(ArticleContext)
  const { showFileCenterModal } = useFileCenterModal(`/articles/${articleId}`)

  return (
    <BaseButton
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault()

        //if (!active) {
        const onSelectImage = (url: string) => {
          if (active) {
            deleteImage(editor)
          }
          insertImage(editor, url)
        }

        showFileCenterModal(onSelectImage)
        // }
        // else {
        //   deleteImage(editor)
        // }
      }}
    >
      <SlateIcon iconType='image' />
    </BaseButton>
  )
}
