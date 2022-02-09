import styles from './content.module.scss'

import { ReactNode } from 'react'

interface Content {
  children: ReactNode
}

const Content = (props: Content) => {
  return <div className={styles.content}>{props.children}</div>
}

export default Content
