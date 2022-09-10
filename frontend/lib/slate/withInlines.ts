import { BaseElement, Editor } from "slate"
import isUrl from 'is-url'

import { wrapLink } from "./utils"

const withInlines = (editor: Editor) => {
  // @ts-ignore
  const { insertData, insertText, isInline, isVoid } = editor

  editor.isInline = element =>
    // @ts-ignore
    ['link', 'button'].includes(element.type) || isInline(element)

  editor.insertText = text => {
    if (text && isUrl(text)) {
      wrapLink(editor, text, 'external')
    } else {
      insertText(text)
    }
  }

  // @ts-ignore
  editor.insertData = data => {
    const text = data.getData('text/plain')

    if (text && isUrl(text)) {
      wrapLink(editor, text, 'external')
    } else {
      insertData(data)
    }
  }

  editor.isVoid = element => {
    // @ts-ignore
    return element.type === 'image' ? true : isVoid(element)
  }


  return editor
}

export default withInlines