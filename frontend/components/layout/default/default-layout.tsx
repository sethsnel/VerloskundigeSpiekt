import { ReactNode } from 'react'

import { Content, Menu } from '..'
import { Article } from '../../../schema/article'

import styles from './default-layout.module.scss'

interface DefaultLayout extends DefaultLayoutProps {
  children: ReactNode
}

export type DefaultLayoutProps = {
  articles: Article[]
}

const DefaultLayout = ({ children, articles }: DefaultLayout) => {
  return (
    <div className={styles.container}>
      <Menu articles={articles} />
      <Content>
        {children}
      </Content>
    </div>
  )
}

export default DefaultLayout
