// import { cache } from 'next/cache'
//import { unstable_cacheTag as cacheTag } from 'next/cache'
import { Metadata } from 'next/types'
import { Analytics } from "@vercel/analytics/next"

import { Providers } from '../components/Providers'
import { DefaultLayout } from '../components/layout'
import { getChannelLabels } from '../content/labels'
import fetchLayoutProps from '../lib/shared/fetchLayoutProps'

import '../styles/_bootstrap.scss'
import '../styles/_colors.scss'
import '../styles/globals.scss'
import './globals.css'

const labels = getChannelLabels()
export const dynamic = 'force-static'

let devNotice = ''
if (process.env.NODE_ENV === 'development') {
  devNotice = 'DEV - '
}
export const metadata: Metadata = {
  title: devNotice + labels.websiteTitle,
  description: labels.websiteDescription,
  manifest: '/site.webmanifest',
  icons: {
    icon: [{
      sizes: '32x32',
      url: '/favicon-32x32.png',
      type: 'image/png',
    }, {
      sizes: '16x16',
      url: '/favicon-16x16.png',
      type: 'image/png',
    }],
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    }
  },
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
        <Analytics />
      </body>
    </html>
  )
}
