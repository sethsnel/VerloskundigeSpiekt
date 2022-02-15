import type { GetStaticPropsContext, NextPage } from 'next'

import { Notes } from '../../containers/notes'
import { Page } from '../../schema/page'

import fetchLayoutProps from '../../lib/shared/fetchLayoutProps'
import { DefaultLayout, DefaultLayoutProps } from '../../components/layout'

import styles from '../../styles/Topic.module.scss'
import getPages from '../../lib/firestore/pages/get-pages'
import getPage from '../../lib/firestore/pages/get-page'

interface PageProps {
  page: Page
  layoutProps: DefaultLayoutProps
}

type PageParams = {
  pageId: string
}

const SubjectPage: NextPage<PageProps> = (props) => {
  return (
    <DefaultLayout {...props.layoutProps}>
      <div className={styles.container}>
        <h1 className={styles.title}>{props.page.name}</h1>

        <main className={styles.main}>
          <Notes notes={props.page.notes} pageId={props.page.id as string} />
        </main>
      </div>
    </DefaultLayout>
  )
}

export async function getStaticProps({ params }: GetStaticPropsContext<PageParams>) {
  const layoutProps = await fetchLayoutProps()
  const page = await getPage(params?.pageId || '')

  return {
    props: {
      page,
      layoutProps,
    },
    revalidate: 60,
  }
}

export async function getStaticPaths() {
  const pages = await getPages()

  return {
    paths: pages.map((p) => ({ params: { pageId: p.id } })),
    fallback: 'blocking',
  }
}

export default SubjectPage
