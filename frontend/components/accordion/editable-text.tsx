
import { useCallback, useMemo, useRef } from 'react'
import { createEditor, Descendant } from 'slate'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'
import { withHistory } from 'slate-history'

import { deserialize } from '../../lib/slate/deserializer'
import { serializeNodes } from '../../lib/slate/serializer'
import { BlockButton } from '../slate/block-button'
import { MarkButton } from '../slate/mark-button'
import { Leaf } from '../slate/leaf'
import { Element as SlateElement } from '../slate/element'
import { Toolbar } from '../slate/toolbar'
import ButtonDivider from '../slate/button-divider'
import { isImageActive, isLinkNodeAtSelection } from '../../lib/slate/utils'
import useSelection from '../../lib/slate/useSelection'
import { LinkEditor } from '../slate/link-editor'

import styles from './editable-text.module.scss'
import { LinkButton } from '../slate/link-button'
import { ImageButton, ImageFloatLeftButton, ImageFloatNoneButton, ImageFloatRightButton } from '../slate/image-button'
import withInlines from '../../lib/slate/withInlines'
import { LinkFileButton } from '../slate/pdf-button'

interface EditableTextProps {
  text: string
  json: Descendant[]
  onChange?: (text: string, json: Descendant[]) => void
}

export const EditableText = (props: EditableTextProps) => {
  const editor = useMemo(() => withInlines(withHistory(withReact(createEditor() as ReactEditor))) as ReactEditor, [])
  const [selection, setSelection] = useSelection(editor)

  let initialValue: Descendant[] = props.json
  if (typeof window !== 'undefined' && props.json.length === 0) {
    const document = new DOMParser().parseFromString(props.text, 'text/html')
    initialValue = deserialize(document.body)
  }

  // @ts-ignore
  //const [value, setValue] = useState<Descendant[]>(initialValue ?? [{ children: [{ text: 'Voeg tekst toe' }] }])
  const renderElement = useCallback(props => <SlateElement {...props} />, [])
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [])

  const onContentUpdate = (value: Descendant[]) => {
    props.onChange && props.onChange(serializeNodes(value), value)
    setSelection(editor.selection)
  }

  const editorRef = useRef<HTMLDivElement>(null)

  return (<Slate editor={editor} value={initialValue} onChange={newValue => { onContentUpdate(newValue) }}>
    <Toolbar>
      <BlockButton format="heading-two" icon="heading" />
      <BlockButton format="paragraph" icon="paragraph" />
      <ButtonDivider />
      <MarkButton format="bold" icon="format_bold" />
      <MarkButton format="italic" icon="format_italic" />
      <MarkButton format="underline" icon="format_underlined" />
      <ButtonDivider />
      <BlockButton format="bulleted-list" icon="u_list" />
      <BlockButton format="numbered-list" icon="o_list" />
      <ButtonDivider />
      <LinkButton />
      <LinkFileButton />
      <ButtonDivider />
      <ImageButton />
      {
        isImageActive(editor) ?
          <>
            <ImageFloatLeftButton />
            <ImageFloatNoneButton />
            <ImageFloatRightButton />
          </> : undefined
      }
    </Toolbar>
    <div className={styles.editor} ref={editorRef}>
      {/* {isLinkNodeAtSelection(editor, selection) ? (
        <LinkEditor
          editor={editor}
          editorOffsets={
            editorRef.current != null
              ? {
                x: editorRef.current.getBoundingClientRect().x,
                y: editorRef.current.getBoundingClientRect().y,
              }
              : null
          }
        />
      ) : null} */}
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf} />
    </div>
  </Slate >)
}