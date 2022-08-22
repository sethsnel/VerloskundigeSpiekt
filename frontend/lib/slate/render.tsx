import escapeHtml from 'escape-html'
import Image from 'next/image'
import { Descendant, Text } from 'slate'

import styles from '../../components/slate/slate.module.scss'

export const renderNodes = (nodes: Descendant[]): JSX.Element[] => {
  return nodes.map((n, i) => renderNode(n, i) as JSX.Element)
}

const renderNode = (node: Descendant, index: number): JSX.Element | string => {
  if (Text.isText(node)) {
    let string = escapeHtml(node.text)
    // @ts-ignore
    if (node.bold) {
      string = `<strong>${string}</strong>`
    }
    return string
  }

  const children = node.children.map((n, i) => renderNode(n, i))

  // @ts-ignore
  switch (node.type) {
    case 'quote':
      return <blockquote key={index}><p>{children}</p></blockquote>
    case 'paragraph':
      return <p key={index}>{children}</p>
    case 'heading-one':
      return <h1 key={index}>{children}</h1>
    case 'heading-two':
      return <h2 key={index}>{children}</h2>
    case 'bulleted-list':
      return <ul key={index}>{children}</ul>
    case 'numbered-list':
      return <ol key={index}>{children}</ol>
    case 'list-item':
      return <li key={index}>{children}</li>
    case 'link':
      // @ts-ignore
      return <a key={index} href="${escapeHtml(node.url)}" target="_blank" rel="external">{children}</a>
    case 'image':
      // @ts-ignore
      return <div
        key={index}
        className={styles.imageContainer}
      >
        <Image
          // @ts-ignore
          src={escapeHtml(node.url)} alt={escapeHtml(node.url)}
          layout='fill'
          objectFit='scale-down'
        />
      </div>
    default:
      return <p key={index}>{children}</p>
  }
}