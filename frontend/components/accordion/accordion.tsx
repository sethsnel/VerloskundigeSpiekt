import { useState } from 'react'

import { Button } from '../button'
import { EditableText } from './editable-text'

import { EditableHeader } from './editable-header'

import styles from './accordion.module.scss'

interface AccordionProps {
  name: string
  text: string
  modificationEnabled?: boolean
  editMode?: boolean
  onUpdate?: (update: AccordionUpdate) => void
  onDelete?: () => void
  onCancel?: () => void
}

type AccordionUpdate = {
  name: string
  text: string
}

const Accordion = (props: AccordionProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(!props.editMode)
  const [editMode, setEditMode] = useState<boolean>(props.editMode ?? false)

  const [name, setName] = useState<string>(props.name)
  const [text, setText] = useState<string>(props.text)

  let accordionClasses = styles.accordion
  if (collapsed) {
    accordionClasses = `${styles.accordion} ${styles.collapsed}`
  }

  const onSave = () => {
    setEditMode(false)
    props.onUpdate && props.onUpdate({ name, text })
  }

  const onCancel = () => {
    setEditMode(false)
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
      <div className={styles.content}>
        {editMode ?
          (<EditableText text={text} onChange={(text: string) => setText(text)} />) :
          (<div dangerouslySetInnerHTML={{ __html: text }}></div>)
        }
        {
          (props.modificationEnabled) ? (
            <div className={styles.buttons}>
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
      </div>
    </div >
  )
}

export default Accordion
