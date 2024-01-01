import Head from 'next/head'
import type { AppProps } from 'next/app'
import { useState } from 'react'
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query'

import { ModalProvider } from '../containers/modalProvider'

import '../styles/_bootstrap.scss'
import '../styles/_colors.scss'
import '../styles/globals.scss'
import styles from '../styles/App.module.scss'

function VerloskundigeSpiektApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <>
      <Head>
        <title className={styles.title}>Recepten Snel de Haas</title>
        <meta
          name='description'
          content='Eeerste hulp bij inspiratie'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <ModalProvider>
            <Component {...pageProps} />
          </ModalProvider>
        </Hydrate>
      </QueryClientProvider>
    </>
  )
}

export default VerloskundigeSpiektApp
