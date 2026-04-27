import Link from 'next/link'

import { Button } from '../ui/button'

export const practiceLinks = [
  { href: '/praktijk/contacten', label: 'Contacten' },
  { href: '/praktijk/ziekenhuizen', label: 'Ziekenhuizen' },
  { href: '/praktijk/sjablonen', label: 'Sjablonen' },
  { href: '/praktijk/assistenten', label: 'Assistente Spiekt' },
  { href: '/praktijk/documenten', label: 'Documenten' },
]

type PracticeLinksProps = {
  className?: string
}

const PracticeLinks = ({ className = 'flex flex-wrap gap-2' }: PracticeLinksProps) => (
  <nav className={className}>
    {practiceLinks.map((link) => (
      <Button key={link.href} asChild variant="outline" size="sm">
        <Link href={link.href}>{link.label}</Link>
      </Button>
    ))}
  </nav>
)

export default PracticeLinks
