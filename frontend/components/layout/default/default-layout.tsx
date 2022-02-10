import { ReactNode } from 'react'

import { Content, Menu } from '..'
import Topic from '../../../schema/topic'

import styles from './default-layout.module.scss'

interface DefaultLayout extends DefaultLayoutProps {
  children: ReactNode
}

export type DefaultLayoutProps = {
  topics: Topic[]
}

const DefaultLayout = ({ children, topics }: DefaultLayout) => {
  return (
    <div className={styles.container}>
      <Menu topics={topics} />
      <Content>
        {children}
      </Content>
    </div>
  )
}

export default DefaultLayout
