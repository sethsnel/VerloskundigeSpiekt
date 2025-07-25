'use client'

import { Hydrate, QueryClient, QueryClientProvider } from 'react-query'
import { ModalProvider } from '../containers/modalProvider'
import { SidebarProvider } from '@/components/ui/sidebar'

export function Providers({ children, sidebarOpen = false }: Readonly<{
  children: React.ReactNode
  sidebarOpen?: boolean
}>) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {/* <Hydrate state={pageProps.dehydratedState}> */}
      <ModalProvider>
        <SidebarProvider defaultOpen={sidebarOpen}>
          {children}
        </SidebarProvider>
      </ModalProvider>
      {/* </Hydrate> */}
    </QueryClientProvider>
  )
}