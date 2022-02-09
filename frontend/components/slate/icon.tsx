import React, { PropsWithChildren, Ref } from "react"
import { RiBold, RiHeading, RiItalic, RiParagraph, RiUnderline } from "react-icons/ri"
import { BaseProps, OrNull } from "../../lib/slate/types"

import styles from './slate.module.scss'

export const Icon = React.forwardRef(
  (
    { className, iconType, ...props }: PropsWithChildren<BaseProps>,
    ref: Ref<OrNull<HTMLSpanElement>>
  ) => {
    let icon = undefined

    if (iconType === 'heading') {
      icon = (<RiHeading />)
    }
    if (iconType === 'paragraph') {
      icon = (<RiParagraph />)
    }
    if (iconType === 'format_italic') {
      icon = (<RiItalic />)
    }
    if (iconType === 'format_underlined') {
      icon = (<RiUnderline />)
    }
    if (iconType === 'format_bold') {
      icon = (<RiBold />)
    }

    return (
      <span
        {...props}
        // @ts-ignore
        ref={ref}
        title={iconType}
        className={styles.icon}
      >{icon}</span>
    )
  }
)
Icon.displayName = 'Icon'