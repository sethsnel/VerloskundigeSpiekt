import { ReactNode } from 'react'
import { GiHamburgerMenu } from "react-icons/gi"

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
  if (!articles || articles.length < 1) {
    articles = []
  }

  return (
    <>
      <div className={styles.container}>
        <Menu articles={articles} />
        <Content>
          {children}
        </Content>
      </div>
      <button type="button" className="rounded-circle btn btn-light position-fixed d-flex d-md-none" style={{ left: '1em', bottom: '1em' }} data-bs-toggle="offcanvas" data-bs-target="#offcanvasMenu" aria-controls="offcanvasMenu">
        <GiHamburgerMenu className='text-secondary' />
      </button >
    </>
  )

}

export default DefaultLayout
