import React from "react"
import { useSlate } from "slate-react"
import { isMarkActive, toggleMark } from "../../lib/slate/utils"

import { BaseButton } from "./base-button"
import { Icon } from "./icon"

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
      <Icon iconType={icon}>{icon}</Icon>
    </BaseButton>
  )
}
