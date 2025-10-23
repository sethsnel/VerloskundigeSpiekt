'use client'

import { Hydrate, QueryClient, QueryClientProvider } from 'react-query'
import { ModalProvider } from '../containers/modalProvider'
import { SidebarProvider } from '@/components/ui/sidebar'

export function Providers({ children }: Readonly<{
  children: React.ReactNode
}>) {
  const queryClient = new QueryClient()
  const defaultOpen = getCookie("sidebar_state") === "true"

  return (
    <QueryClientProvider client={queryClient}>
      {/* <Hydrate state={pageProps.dehydratedState}> */}
      <ModalProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          {children}
        </SidebarProvider>
      </ModalProvider>
      {/* </Hydrate> */}
    </QueryClientProvider>
  )
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  const cookieValue = parts.pop()
  if (cookieValue !== undefined) return cookieValue.split(';').shift()
}