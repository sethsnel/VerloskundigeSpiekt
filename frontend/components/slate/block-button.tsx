import { useSlate } from 'slate-react'

import { isBlockActive, toggleBlock } from '../../lib/slate/utils'

import { BaseButton } from './base-button'
import { SlateIcon } from './icon.slate'

// @ts-ignore
export const BlockButton = ({ format, icon }) => {
  const editor = useSlate()
  const active = isBlockActive(editor, format)

  return (
    <BaseButton
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      <SlateIcon iconType={icon} active={active}>{icon}</SlateIcon>
    </BaseButton>
  )
}
