import React, { PropsWithChildren, Ref } from "react"
import { BaseProps, OrNull } from "../../lib/slate/types"

import styles from './slate.module.scss'

export const BaseButton = React.forwardRef(
  (
    {
      className,
      active,
      reversed,
      ...props
    }: PropsWithChildren<
      {
        active: boolean
        reversed: boolean
      } & BaseProps
    >,
    ref: Ref<OrNull<HTMLSpanElement>>
  ) => (
    <span
      {...props}
      // @ts-ignore
      ref={ref}
      className={styles.button}
    />
  )
)

BaseButton.displayName = 'BaseButton'