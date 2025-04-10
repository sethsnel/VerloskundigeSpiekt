import { BaseEditor, Editor, Transforms, Element as SlateElement, Location as SlateLocation, BaseRange, Descendant, Range as SlateRange } from "slate"

const LIST_TYPES = ['numbered-list', 'bulleted-list']

export const isBlockActive = (editor: BaseEditor, format: string) => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        // @ts-ignore
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  )

  return !!match
}

export const toggleBlock = (editor: BaseEditor, format: string) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      // @ts-ignore
      LIST_TYPES.includes(n.type),
    split: true,
  })
  const newProperties: Partial<SlateElement> = {
    // @ts-ignore
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  }
  Transforms.setNodes<SlateElement>(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

export const toggleMark = (editor: BaseEditor, format: string) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export const isMarkActive = (editor: BaseEditor, format: string) => {
  const marks = Editor.marks(editor)
  // @ts-ignore
  return marks ? marks[format] === true : false
}

export const insertLink = (editor: BaseEditor, url: string, type: LinkSubType) => {
  if (editor.selection) {
    wrapLink(editor, url, type)
  }
}

export const wrapLink = (editor: BaseEditor, url: string, type: LinkSubType) => {
  if (isLinkActive(editor, type)) {
    unwrapLink(editor, type)
  }

  const { selection } = editor
  const isCollapsed = selection && SlateRange.isCollapsed(selection)
  const link: LinkElement = {
    type: 'link',
    subType: type,
    url,
    children: isCollapsed ? [{ text: url }] : [],
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: 'end' })
  }
}

export const unwrapLink = (editor: BaseEditor, type: LinkSubType) => {
  Transforms.unwrapNodes(editor, {
    match: n =>
      // @ts-ignore
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link' && n.subType === type,
  })
}

export const isLinkActive = (editor: BaseEditor, type?: LinkSubType) => {
  // @ts-ignore
  const [link] = Editor.nodes(editor, {
    match: n =>
      // @ts-ignore
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link' && (n.subType === type || type === undefined),
  })
  return !!link
}

export const insertImage = (editor: BaseEditor, url: string, width: number, height: number) => {
  const text = { text: '' }
  const image: ImageElement = { type: 'image', url, width, height, children: [text] }
  Transforms.insertNodes(editor, image)
}

export const deleteImage = (editor: BaseEditor) => {
  Transforms.removeNodes(editor, {
    match: n =>
      // @ts-ignore
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'image',
  })
}

export const updateImage = (editor: BaseEditor, url: string, width: number, height: number, position?: 'floatLeft' | 'floatRight') => {
  const text = { text: '' }
  const image: ImageElement = { type: 'image', url, width, height, children: [text], position }
  Transforms.setNodes(editor, image, {
    match: n => {
      // @ts-ignore
      return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'image'
    },
  })
}

export const isImageActive = (editor: BaseEditor) => {
  // @ts-ignore
  const [image] = Editor.nodes(editor, {
    match: n =>
      // @ts-ignore
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'image',
  })
  return !!image
}

export const imageHasPosition = (editor: BaseEditor, position?: ImagePosition) => {
  // @ts-ignore
  const [image] = Editor.nodes(editor, {
    match: n =>
      // @ts-ignore
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'image',
  })
  // @ts-ignore
  return !!image && image && image[0]?.position === position
}

export function isLinkNodeAtSelection(editor: BaseEditor, selection: BaseRange | null) {
  if (selection == null) {
    return false
  }

  return (
    Editor.above(editor, {
      at: selection,
      match: (n: any) => n.type === "link",
    }) != null
  )
}

export type LinkElement = {
  type: 'link'
  url: string
  subType: LinkSubType
  children: Descendant[]
}
export type ImageElement = {
  type: 'image'; url: string; width: number, height: number, children: Descendant[],
  position?: ImagePosition
}

type ImagePosition = 'floatLeft' | 'floatRight'
type LinkSubType = 'external' | 'document'