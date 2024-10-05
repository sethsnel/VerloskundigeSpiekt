import React, { PropsWithChildren, Ref } from "react"
import { BaseProps, OrNull } from "../../lib/slate/types"

import styles from './slate.module.scss'

export const Menu = React.forwardRef(
  (
    //{ className, ...props }: PropsWithChildren<BaseProps>,
    { className, ...props }: any,
    ref: Ref<OrNull<HTMLDivElement>>
  ) => (
    <div
      {...props}
      // @ts-ignore
      ref={ref}
      className={styles.menu}
    />
  )
)
Menu.displayName = 'Menu'