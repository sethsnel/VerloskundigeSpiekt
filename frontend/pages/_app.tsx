import type { AppProps } from 'next/app'
import Head from 'next/head'

import { Content, Menu } from '../components/layout'

import '../styles/_colors.scss'
import '../styles/globals.scss'
import styles from '../styles/App.module.scss'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title className={styles.title}>Verloskundige spiekt</title>
        <meta
          name='description'
          content='Eeerste hulp bij verloskudige kennis'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className={styles.container}>
        <Menu />
        <Content>
          <Component {...pageProps} />
        </Content>
      </div>
    </>
  )
}

export default MyApp
