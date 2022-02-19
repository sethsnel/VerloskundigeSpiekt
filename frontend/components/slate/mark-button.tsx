import React from "react"
import { useSlate } from "slate-react"
import { isMarkActive, toggleMark } from "../../lib/slate/utils"

import { BaseButton } from "./base-button"
import { SlateIcon } from "./icon.slate"

// @ts-ignore
export const MarkButton = ({ format, icon }) => {
  const editor = useSlate()

  return (
    <BaseButton
      active={isMarkActive(editor, format)}
      onMouseDown={(event: any) => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      <SlateIcon iconType={icon}>{icon}</SlateIcon>
    </BaseButton>
  )
}
