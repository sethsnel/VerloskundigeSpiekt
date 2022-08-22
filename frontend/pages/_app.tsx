import Head from 'next/head'
import type { AppProps } from 'next/app'
import { useState } from 'react'
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query'

import '../styles/_bootstrap.scss'
import '../styles/_colors.scss'
import '../styles/globals.scss'
import styles from '../styles/App.module.scss'
import { ModalContext } from '../lib/hooks/utilities/useModal'

function VerloskundigeSpiektApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [modal, setModal] = useState<JSX.Element | undefined>(undefined)

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
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <ModalContext.Provider value={[undefined, setModal]}>
            {modal}
            <Component {...pageProps} />
          </ModalContext.Provider>
        </Hydrate>
      </QueryClientProvider>
    </>
  )
}

export default VerloskundigeSpiektApp
