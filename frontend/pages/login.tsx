import { dehydrate, QueryClient } from 'react-query'
import type { NextPage } from 'next'
import Head from 'next/head'

import { signInWithFirebase } from '../lib/auth/firebase-auth'
import fetchLayoutProps from '../lib/shared/fetchLayoutProps'
import { DefaultLayout, DefaultLayoutProps } from '../components/layout'

import styles from '../styles/Login.module.scss'
import 'firebaseui/dist/firebaseui.css'

interface LoginPageProps {
  layoutProps: DefaultLayoutProps
}

const Login: NextPage<LoginPageProps> = ({ layoutProps }) => {
  if (typeof window !== 'undefined') {
    signInWithFirebase()
  }

  return (
    <>
      <Head>
        <title className={styles.title}>Verloskundige Spiekt</title>
        <meta
          name='description'
          content='Eeerste hulp bij verloskudige kennis'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <DefaultLayout {...layoutProps}>
        <div className={styles.main}>
          <h1>Verloskundige spiekt</h1>
          <div id="firebaseui-auth-container"></div>
        </div>
      </DefaultLayout>
    </>
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

export default Login
