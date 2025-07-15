import styles from '../styles/Home.module.scss'
import dynamic from 'next/dynamic'

const channel = process.env.NEXT_PUBLIC_CHANNEL || 'VerloskundigeSpiekt'

const mdxMap: Record<string, any> = {
  // @ts-ignore
  VerloskundigeSpiekt: dynamic(() => import('../content/verloskundigespiekt.mdx')),
  // @ts-ignore
  Recepten: dynamic(() => import('../content/recepten.mdx')),
}

export default function Home() {
  const MdxContent = mdxMap[channel]
  return (
    <div className={styles.main}>
      <MdxContent />
    </div>
  )
}
