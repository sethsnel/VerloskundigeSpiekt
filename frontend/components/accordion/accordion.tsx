import { useState } from 'react'

import { Button } from '../button'
import { EditableText } from './editable-text'
import { renderNodes } from '../../lib/slate/render'

import { EditableHeader } from './editable-header'

import styles from './accordion.module.scss'
import { Descendant } from 'slate'

interface AccordionProps {
  name: string
  text: string
  json: Descendant[]
  modificationEnabled?: boolean
  editMode?: boolean
  onUpdate?: (update: AccordionUpdate) => void
  onDelete?: () => void
  onCancel?: () => void
}

type AccordionUpdate = {
  name: string
  text: string
  json: Descendant[]
}

const Accordion = (props: AccordionProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(!props.editMode)
  const [editMode, setEditMode] = useState<boolean>(props.editMode ?? false)

  const [name, setName] = useState<string>(props.name)
  const [content, setContent] = useState<{ text: string, json: Descendant[] }>({ text: props.text, json: props.json })

  let accordionClasses = styles.accordion
  if (collapsed) {
    accordionClasses = `${styles.accordion} ${styles.collapsed}`
  }
  if (!collapsed && props.modificationEnabled) {
    accordionClasses = `${accordionClasses} ${styles.edit}`
  }

  const onSave = () => {
    setEditMode(false)
    props.onUpdate && props.onUpdate({ name, text: content.text, json: content.json })
  }

  const onCancel = () => {
    setEditMode(false)
    setContent({ text: props.text, json: props.json })
    props.onCancel && props.onCancel()
  }

  return (
    <div className={accordionClasses}>
      {editMode ?
        <EditableHeader name={name} onChange={(newName: string) => setName(newName)} /> :
        <h2 className={styles.name} onClick={() => setCollapsed(!collapsed)}>
          {name}
        </h2>
      }
      <div className={`${styles.content} ${props.modificationEnabled && !collapsed && styles.edit}`}>
        {editMode ?
          (<EditableText text={content.text} json={content.json} onChange={(text: string, json: Descendant[]) => setContent({ text, json })} />) :
          content.json.length > 0 ?
            renderNodes(content.json) :
            (<div dangerouslySetInnerHTML={{ __html: content.text }}></div>)
        }
      </div>
      {
        (props.modificationEnabled && !collapsed) ? (
          <div className={`${styles.buttons} ${editMode && styles.edit}`}>
            {editMode ?
              (<>
                <Button icon="save" onClick={() => onSave()}>opslaan</Button>
                <Button icon="cancel" onClick={() => onCancel()}>annuleren</Button>
                {
                  props.onDelete ? <Button icon="delete" onClick={() => props.onDelete && props.onDelete()}>verwijderen</Button> : undefined
                }
              </>) :
              (<Button icon="edit" onClick={() => setEditMode(true)}>bewerken</Button>)
            }
          </div>
        ) : undefined
      }
    </div >
  )
}

export default Accordion
