'use client'

import { Hydrate, QueryClient, QueryClientProvider } from 'react-query'
import { ModalProvider } from '../containers/modalProvider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'

export function Providers({ children }: Readonly<{
  children: React.ReactNode
}>) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {/* <Hydrate state={pageProps.dehydratedState}> */}
      <ModalProvider>
        <SidebarProvider defaultOpen={false}>
          {children}
        </SidebarProvider>
      </ModalProvider>
      {/* </Hydrate> */}
    </QueryClientProvider>
  )
}