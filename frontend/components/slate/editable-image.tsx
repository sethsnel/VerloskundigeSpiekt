import React, { useRef } from 'react'
import Image from 'next/image'
import { useFocused, useSelected, useSlate } from 'slate-react'

import slateStyles from './slate.module.scss'
import articleStyles from '../../styles/Article.module.scss'
import useSize from '@react-hook/size'
import { updateImage } from '../../lib/slate/utils'

//@ts-ignore
const EditableImage = ({ attributes, children, element }) => {
  const editor = useSlate()
  const selected = useSelected()
  const focused = useFocused()
  const target = useRef<null | HTMLDivElement>(null)
  const [width, height] = useSize(target.current?.firstChild as HTMLElement ?? null)

  if (height > 10 && element.url && element?.height !== height) {
    updateImage(editor, element.url, element?.width, height, element?.position)
  }

  return (
    <div {...attributes}>
      <div
        ref={target}
        id={element.url}
        contentEditable={false}
        className={`${articleStyles.imageContainer} ${selected && focused && slateStyles.selected} ${element.position === 'floatLeft' && articleStyles.floatLeft} ${element.position === 'floatRight' && articleStyles.floatRight}`}
        style={{ height: element?.height }}
      >
        <Image
          src={element.url}
          alt={element.url}
          layout={'fill'}
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

export default EditableImage