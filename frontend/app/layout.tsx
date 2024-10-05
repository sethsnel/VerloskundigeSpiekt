import { Metadata } from 'next/types'

import '../styles/_bootstrap.scss'
import '../styles/_colors.scss'
import '../styles/globals.scss'
import { Providers } from '../components/Providers'
import { DefaultLayout } from '../components/layout'
import fetchLayoutProps from '../lib/shared/fetchLayoutProps'

export const metadata: Metadata = {
  title: 'Recepten Snel de Haas',
  description: 'Eeerste hulp bij inspiratie',
  icons: ['/favicon.ico']
}

export default async function VerloskundigeSpiektApp({ children }: { children: React.ReactNode }) {
  const layoutProps = await fetchLayoutProps()

  return (
    <html lang="nl">
      <body>
        <Providers>
          <DefaultLayout {...layoutProps}>
            {children}
          </DefaultLayout>
        </Providers>
      </body>
    </html>
  )
}
