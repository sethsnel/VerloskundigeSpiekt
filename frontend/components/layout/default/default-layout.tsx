import { ReactNode } from 'react'

import { Article } from '../../../schema/article'
import { Content, Menu } from '..'

import styles from './default-layout.module.scss'

interface DefaultLayout {
  children: ReactNode
}

export type DefaultLayoutProps = {
  articles: Article[]
}

const DefaultLayout = ({ children, articles }: DefaultLayoutProps & { children: ReactNode }) => {
  if (articles && articles.length > 0) {
    return (
      <div className={styles.container}>
        <Menu articles={articles} />
        <Content>
          {children}
        </Content>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Menu articles={[]} />
      <Content>
        {children}
      </Content>
    </div>
  )

}

export default DefaultLayout
