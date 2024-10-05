import React, { PropsWithChildren, Ref } from "react"
import { BaseProps, OrNull } from "../../lib/slate/types"

import styles from './slate.module.scss'

type BaseButtonProps = PropsWithChildren<BaseProps & {
  disabled: boolean
  reversed: boolean
}>

// @ts-ignore
export const BaseButton = React.forwardRef(
  (
    {
      className,
      active,
      disabled,
      reversed,
      ...props
    }: any,
    ref: Ref<OrNull<HTMLSpanElement>>
  ) => (
    <span
      {...props}
      // @ts-ignore
      ref={ref}
      className={`
        ${styles.button}
        ${active ? styles.active : undefined}
        ${disabled ? styles.disabled : undefined}
      `}
    />
  )
)

BaseButton.displayName = 'BaseButton'