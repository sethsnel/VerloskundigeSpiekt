import React, { PropsWithChildren, Ref } from "react"
import { RiBold, RiHeading, RiItalic, RiParagraph, RiUnderline, RiListUnordered, RiListOrdered, RiLinkM, RiLinkUnlinkM, RiImageAddFill, RiFileDamageFill } from "react-icons/ri"
import { TbFloatLeft, TbFloatNone, TbFloatRight } from "react-icons/tb"

import { BaseProps, OrNull } from "../../lib/slate/types"

import styles from './slate.module.scss'

export const SlateIcon = React.forwardRef(
  (
    { className, iconType, active, ...props }: PropsWithChildren<BaseProps>,
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
    if (iconType === 'u_list') {
      icon = (<RiListUnordered />)
    }
    if (iconType === 'o_list') {
      icon = (<RiListOrdered />)
    }
    if (iconType === 'link') {
      icon = (<RiLinkM />)
    }
    if (iconType === 'link' && active) {
      icon = (<RiLinkUnlinkM />)
    }
    if (iconType === 'image') {
      icon = (<RiImageAddFill />)
    }
    if (iconType === 'floatLeft') {
      icon = (<TbFloatLeft />)
    }
    if (iconType === 'floatNone') {
      icon = (<TbFloatNone />)
    }
    if (iconType === 'floatRight') {
      icon = (<TbFloatRight />)
    }
    // if (iconType === 'image' && active) {
    //   icon = (<RiFileDamageFill />)
    // }

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

SlateIcon.displayName = 'SlateIcon'
