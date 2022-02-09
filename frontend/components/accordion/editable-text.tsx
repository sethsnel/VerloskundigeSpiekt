
import { useCallback, useMemo, useState } from 'react'
import { createEditor, Descendant } from 'slate'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'
import { deserialize } from '../../lib/slate/deserializer'
import { serializeNodes } from '../../lib/slate/serializer'
import { BlockButton } from '../slate/block-button'
import { MarkButton } from '../slate/mark-button'
import { Leaf } from '../slate/leaf'
import { Element as SlateElement } from '../slate/element'
import { Toolbar } from '../slate/toolbar'

interface EditableTextProps {
  text: string
  onChange?: (text: string) => void
}

export const EditableText = (props: EditableTextProps) => {
  const editor = useMemo(() => withReact(createEditor() as ReactEditor), [])

  let initialValue: Descendant[] = [{ children: [{ text: 'Voeg tekst toe' }] }]
  if (typeof window !== 'undefined') {
    const document = new DOMParser().parseFromString(props.text, 'text/html')
    initialValue = deserialize(document.body)
  }

  // @ts-ignore
  //const [value, setValue] = useState<Descendant[]>(initialValue ?? [{ children: [{ text: 'Voeg tekst toe' }] }])
  const renderElement = useCallback(props => <SlateElement {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  const onContentUpdate = (value: Descendant[]) => {
    //setValue(value)
    props.onChange && props.onChange(serializeNodes(value))
  }

  return (<Slate editor={editor} value={initialValue} onChange={newValue => { onContentUpdate(newValue) }}>
    <Toolbar>
      <MarkButton format="bold" icon="format_bold" />
      <MarkButton format="italic" icon="format_italic" />
      <MarkButton format="underline" icon="format_underlined" />
      <BlockButton format="heading-two" icon="heading" />
      <BlockButton format="paragraph" icon="paragraph" />
    </Toolbar>
    <Editable
      renderElement={renderElement}
      renderLeaf={renderLeaf} />
  </Slate>)
}