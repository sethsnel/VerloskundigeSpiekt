import React, { PropsWithChildren, Ref } from "react"

import { BaseProps, OrNull } from "../../lib/slate/types"
import { Menu } from "./menu"

import styles from './slate.module.scss'

export const Toolbar = React.forwardRef(
  (
    //{ className, ...props }: PropsWithChildren<BaseProps>,
    { className, ...props }: any,
    ref: Ref<OrNull<HTMLDivElement>>
  ) => (
    <Menu
      {...props}
      // @ts-ignore
      ref={ref}
      className={styles.toolbar}
    />
  )
)
Toolbar.displayName = 'Toolbar'