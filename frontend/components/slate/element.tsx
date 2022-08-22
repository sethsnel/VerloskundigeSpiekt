import React from 'react'
import Image from 'next/image'
import { ReactEditor, useFocused, useSelected, useSlateStatic } from 'slate-react'

import styles from './slate.module.scss'

export const Element = (props: any) => {
  const { attributes, children, element } = props

  switch (element.type) {
    default:
      return <p {...attributes}>{children}</p>
    case 'quote':
      return <blockquote {...attributes}>{children}</blockquote>
    case 'code':
      return (
        <pre>
          <code {...attributes}>{children}</code>
        </pre>
      )
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>
    case 'heading-three':
      return <h3 {...attributes}>{children}</h3>
    case 'heading-four':
      return <h4 {...attributes}>{children}</h4>
    case 'heading-five':
      return <h5 {...attributes}>{children}</h5>
    case 'heading-six':
      return <h6 {...attributes}>{children}</h6>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    case 'link':
      return <a href={element.url} {...attributes}>{children}</a>
    case 'image':
      return <EditableImage {...props} />
  }
}

//@ts-ignore
const EditableImage = ({ attributes, children, element }) => {
  const selected = useSelected()
  const focused = useFocused()

  return (
    <div {...attributes}>
      <div
        contentEditable={false}
        className={`${styles.imageContainer} ${selected && focused && styles.selected}`}
      >
        <Image
          src={element.url}
          alt={element.url}
          layout='fill'
          objectFit='scale-down'
        />
        {/* <Button
          active
          onClick={() => Transforms.removeNodes(editor, { at: path })}
          className={css`
            display: ${selected && focused ? 'inline' : 'none'};
            position: absolute;
            top: 0.5em;
            left: 0.5em;
            background-color: white;
          `}
        >
          <Icon>delete</Icon>
        </Button> */}
      </div>
      {children}
    </div>
  )
}
