// import { cache } from 'next/cache'
//import { unstable_cacheTag as cacheTag } from 'next/cache'
import { Metadata } from 'next/types'
import { cookies } from 'next/headers'

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
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <html lang="nl">
      <body>
        <Providers sidebarOpen={defaultOpen}  >
          <DefaultLayout {...layoutProps}>{children}</DefaultLayout>
        </Providers>
      </body>
    </html>
  )
}
