import { useSlate } from 'slate-react'

import { isBlockActive, toggleBlock } from '../../lib/slate/utils'
import { BaseButton } from './base-button'
import { Icon } from './icon'

// @ts-ignore
export const BlockButton = ({ format, icon }) => {
  const editor = useSlate()

  return (
    <BaseButton
      active={isBlockActive(editor, format)}
      onMouseDown={(event: any) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      <Icon iconType={icon}>{icon}</Icon>
    </BaseButton>
  )
}
