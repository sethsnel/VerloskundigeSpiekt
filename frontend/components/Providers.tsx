'use client'

import { Hydrate, QueryClient, QueryClientProvider } from 'react-query'
import { ModalProvider } from '../containers/modalProvider'

export function Providers({ children }: Readonly<{
  children: React.ReactNode
}>) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {/* <Hydrate state={pageProps.dehydratedState}> */}
      <ModalProvider>
        {children}
      </ModalProvider>
      {/* </Hydrate> */}
    </QueryClientProvider>
  )
}