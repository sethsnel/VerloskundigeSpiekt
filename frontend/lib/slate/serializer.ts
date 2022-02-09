import escapeHtml from 'escape-html'
import { Descendant, Text } from 'slate'

export const serializeNodes = (nodes: Descendant[]): string => {
  return nodes.map(n => serializeNode(n)).join('')
}

const serializeNode = (node: Descendant): string => {
  if (Text.isText(node)) {
    let string = escapeHtml(node.text)
    // @ts-ignore
    if (node.bold) {
      string = `<strong>${string}</strong>`
    }
    return string
  }

  // @ts-ignore
  const children = node.children.map(n => serializeNode(n)).join('')

  // @ts-ignore
  switch (node.type) {
    case 'quote':
      return `<blockquote><p>${children}</p></blockquote>`
    case 'paragraph':
      return `<p>${children}</p>`
    case 'heading-one':
      return `<h1>${children}</h1>`
    case 'heading-two':
      return `<h2>${children}</h2>`
    case 'link':
      // @ts-ignore
      return `<a href="${escapeHtml(node.url)}">${children}</a>`
    default:
      return children
  }
}