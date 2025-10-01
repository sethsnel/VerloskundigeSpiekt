import Image from 'next/image'
import { Descendant, Text } from 'slate'

import styles from '../../styles/Article.module.scss'

export const renderNodes = (nodes: Descendant[]): JSX.Element[] => {
  return nodes.map((n, i) => renderNode(n, i) as JSX.Element)
}

const renderNode = (node: Descendant, index: number): JSX.Element | string => {
  if (Text.isText(node)) {
    let classNames: string = ''
    // @ts-ignore
    if (node.bold) {
      classNames += ' ' + styles.bold
    }
    // @ts-ignore
    if (node.italic) {
      classNames += ' ' + styles.italic
    }
    // @ts-ignore
    if (node.underline) {
      classNames += ' ' + styles.underline
    }

    return classNames !== '' ? <span key={index} className={classNames}>{node.text}</span> : node.text
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
      return <ul key={index} className='list-inside list-disc'>{children}</ul>
    case 'numbered-list':
      return <ol key={index} className='list-inside list-decimal'>{children}</ol>
    case 'list-item':
      return <li key={index}>{children}</li>
    case 'link':
      // @ts-ignore
      if (node.subType === 'document') {
        // @ts-ignore
        return <a className='underline text-link hover:text-link-hover visited:text-link-visited' key={index} href={node.url} target="_blank" rel="noreferrer">{children}</a>
      }
      else {
        // @ts-ignore
        return <a className='underline text-link hover:text-link-hover visited:text-link-visited' key={index} href={node.url} target="_blank" rel="noreferrer external">{children}</a>
      }
    case 'image':
      // @ts-ignore
      return <div
        key={index}
        // @ts-ignore
        className={`${styles.imageContainer} ${node.position === 'floatLeft' && styles.floatLeft} ${node.position === 'floatRight' && styles.floatRight}`} style={{ height: node?.height }}
      >
        <Image
          // @ts-ignore
          src={node.url} alt={node.url}
          fill={true}
          style={{ objectFit: 'scale-down' }}
        />
      </div>
    default:
      return <p key={index}>{children}</p>
  }
}