import { ReactNode } from 'react'
import { useQuery } from 'react-query'

import fetchLayoutProps from '../../../lib/shared/fetchLayoutProps'
import { Article } from '../../../schema/article'
import { Content, Menu } from '..'

import styles from './default-layout.module.scss'

interface DefaultLayout {
  children: ReactNode
}

export type DefaultLayoutProps = {
  articles: Article[]
}

const DefaultLayout = ({ children }: DefaultLayout) => {
  const { data } = useQuery('layoutPropsQueryKey', fetchLayoutProps)

  const { articles } = data as DefaultLayoutProps

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
