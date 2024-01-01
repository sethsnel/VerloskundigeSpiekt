import type { NextPage } from 'next'
import Head from 'next/head'
import { dehydrate, QueryClient } from 'react-query'

import { DefaultLayout, DefaultLayoutProps } from '../components/layout'
import fetchLayoutProps from '../lib/shared/fetchLayoutProps'

import styles from '../styles/Home.module.scss'

interface HomePageProps {
  layoutProps: DefaultLayoutProps
}

const Home: NextPage<HomePageProps> = ({ layoutProps }: HomePageProps) => {
  return (
    <div>
      <Head>
        <title className={styles.title}>Recepten Snel de Haas</title>
        <meta
          name='description'
          content='Eeerste plaats voor recepten inspiratie!'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <DefaultLayout {...layoutProps}>
        <div className={styles.main}>
          <h1 className={styles.title}>Recepten Snel de Haas</h1>
          <p>Voor feesten en partijen of een doordeweekse maaltijd, altijd de juiste inspiratie.</p>
          <p>Onderwerpen of sub-onderwerpen die je hier toevoegt, zijn alleen zichtbaar voor jezelf als je ingelogd bent</p>
        </div>
      </DefaultLayout>
    </div>
  )
}

export async function getStaticProps() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery('layoutPropsQueryKey', fetchLayoutProps)

  return {
    props: {
      dehydratedState: dehydrate(queryClient)
    },
    revalidate: 60 * 10
  }
}

export default Home
