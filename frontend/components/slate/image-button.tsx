import { useContext } from 'react'
import { useSlate } from 'slate-react'
import { ArticleContext } from '../../containers/notes/notes.container'
import { useFileCenterModal } from '../../lib/hooks/files'

import { imageGetPosition, imageHasPosition, insertImage, isImageActive, updateImage } from '../../lib/slate/utils'

import { BaseButton } from './base-button'
import { SlateIcon } from './icon.slate'

// @ts-ignore
export const ImageButton = () => {
  const editor = useSlate()

  const active = isImageActive(editor)
  const articleId = useContext(ArticleContext)

  const onSelectImage = async (url: string) => {
    const { width, height } = await getImageSize(url)
    if (active) {
      updateImage(editor, url, width, height, imageGetPosition(editor))
    } else {
      insertImage(editor, url, width, height)
    }
  }
  const { showFileCenterModal } = useFileCenterModal(`/articles/${articleId}`, onSelectImage)

  return (
    <BaseButton
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault()
        showFileCenterModal()
      }}
    >
      <SlateIcon iconType='image' />
    </BaseButton>
  )
}

export const ImageFloatLeftButton = () => {
  const editor = useSlate()
  const { selection } = editor
  const position = 'floatLeft'
  const active = imageHasPosition(editor, position)

  return (
    <BaseButton
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault()

        const currentImage = selection?.anchor?.path[0] ? editor.children[selection?.anchor?.path[0]] : undefined
        if (!active && currentImage) {
          //@ts-ignore
          updateImage(editor, currentImage.url, currentImage?.width, currentImage.height, position)
        }
      }}
    >
      <SlateIcon iconType='floatLeft' />
    </BaseButton>
  )
}

export const ImageFloatRightButton = () => {
  const editor = useSlate()
  const { selection } = editor
  const position = 'floatRight'
  const active = imageHasPosition(editor, position)

  return (
    <BaseButton
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault()

        const currentImage = selection?.anchor?.path[0] ? editor.children[selection?.anchor?.path[0]] : undefined
        if (!active && currentImage) {
          //@ts-ignore
          updateImage(editor, currentImage.url, currentImage?.width, currentImage.height, position)
        }
      }}
    >
      <SlateIcon iconType='floatRight' />
    </BaseButton>
  )
}

export const ImageFloatNoneButton = () => {
  const editor = useSlate()
  const { selection } = editor
  const position = undefined
  const active = imageHasPosition(editor, position)

  return (
    <BaseButton
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault()

        const currentImage = selection?.anchor?.path[0] ? editor.children[selection?.anchor?.path[0]] : undefined
        if (!active && currentImage) {
          //@ts-ignore
          updateImage(editor, currentImage.url, currentImage?.width, currentImage.height, position)
        }
      }}
    >
      <SlateIcon iconType='floatNone' />
    </BaseButton>
  )
}

function getImageSize(url: string) {
  const img = document.createElement("img")

  const promise: Promise<{ height: number, width: number }> = new Promise((resolve, reject) => {
    img.onload = () => {
      // Natural size is the actual image size regardless of rendering.
      // The 'normal' `width`/`height` are for the **rendered** size.
      const width = img.naturalWidth
      const height = img.naturalHeight

      // Resolve promise with the width and height
      resolve({ width, height })
    }

    // Reject promise on error
    img.onerror = reject
  })

  // Setting the source makes it start downloading and eventually call `onload`
  img.src = url

  return promise
}