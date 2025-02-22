// import { cache } from 'next/cache'
//import { unstable_cacheTag as cacheTag } from 'next/cache'
import { Metadata } from 'next/types'

import { Providers } from '../components/Providers'
import { DefaultLayout } from '../components/layout'
import fetchLayoutProps from '../lib/shared/fetchLayoutProps'

import '../styles/_bootstrap.scss'
import '../styles/_colors.scss'
import '../styles/globals.scss'

export const dynamic = 'force-static'
export const metadata: Metadata = {
  title: 'Verloskundige Spiekt',
  description: 'Eerste hulp bij verloskudige kennis',
  icons: ['/favicon.ico'],
}

// const getLayoutData = cache(
//   async () => {
//     return await fetchLayoutProps()
//   },
//   ['layout_props'],
//   { revalidate: false }
// )

export default async function VerloskundigeSpiektApp({ children }: { children: React.ReactNode }) {
  const layoutProps = await fetchLayoutProps()

  return (
    <html lang="nl">
      <body>
        <Providers>
          <DefaultLayout {...layoutProps}>{children}</DefaultLayout>
        </Providers>
      </body>
    </html>
  )
}
