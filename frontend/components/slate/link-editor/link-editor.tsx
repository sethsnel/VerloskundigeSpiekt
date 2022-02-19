import { ReactEditor } from "slate-react"
import { ReactElement, ReactNode, useEffect, useRef } from 'react'
import { Editor } from 'slate'

import styles from './link.editor.module.scss'

interface LinkEditorProps {
  editorOffsets: {
    x: number,
    y: number
  } | null,
  editor: ReactEditor
}

export default function LinkEditor({ editorOffsets, editor }: LinkEditorProps) {
  const linkEditorRef = useRef<null | HTMLElement>(null)

  // @ts-ignore
  const [linkNode, path] = Editor.above(editor, {
    match: (n: any) => n.type === "link",
  })

  useEffect(() => {
    const linkEditorEl = linkEditorRef.current
    if (linkEditorEl == null) {
      return
    }

    const linkDOMNode = ReactEditor.toDOMNode(editor, linkNode)
    const {
      x: nodeX,
      height: nodeHeight,
      y: nodeY,
    } = linkDOMNode.getBoundingClientRect()

    if (editorOffsets) {
      linkEditorEl.style.display = "block"
      linkEditorEl.style.top = `${nodeY + nodeHeight - editorOffsets.y
        }px`
      linkEditorEl.style.left = `${nodeX - editorOffsets.x}px`
    }
  }, [editor, editorOffsets?.x, editorOffsets?.y, linkNode])

  if (editorOffsets == null) {
    return null
  }

  // @ts-ignore
  return <div ref={linkEditorRef} className={styles.linkEditor}>TEST</div>
}