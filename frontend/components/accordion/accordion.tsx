import { useEffect, useState } from 'react'

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '../button'
import { EditableText } from './editable-text'
import { renderNodes } from '../../lib/slate/render'
import { FaRegClipboard } from 'react-icons/fa'
import { useCopyToClipboard } from '@/lib/hooks/utilities/useCopyToClipboard'

import { EditableHeader } from './editable-header'

import styles from './accordion.module.scss'
import { Descendant } from 'slate'

interface AccordionProps {
  id: string
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

const useHashRoute = () => {
  'use client'
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash.slice(1) : null)

  useEffect(() => {
    setHash(typeof window !== 'undefined' ? window.location.hash.slice(1) : null)
  }, [])

  return hash
}

const ArticleAccordion = (props: AccordionProps) => {
  const hashRoute = useHashRoute()
  // const [collapsed, setCollapsed] = useState<boolean>(!props.editMode && hashRoute != props.id)
  const [editMode, setEditMode] = useState<boolean>(props.editMode ?? false)
  const [name, setName] = useState<string>(props.name)
  const [content, setContent] = useState<{ text: string; json: Descendant[] }>({ text: props.text, json: props.json })
  const { copied, contentRef, handleCopy } = useCopyToClipboard()

  //let accordionClasses = styles.accordion
  // if (collapsed) {
  //   accordionClasses = `${styles.accordion} ${styles.collapsed}`
  // }
  // if (!collapsed && props.modificationEnabled) {
  //   accordionClasses = `${accordionClasses} ${styles.edit}`
  // }

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
    <AccordionItem value={props.id}>
      <AccordionTrigger disabled={editMode}>
        <EditableHeader name={name} editMode={editMode} onChange={(newName: string) => setName(newName)} />
      </AccordionTrigger>
      <AccordionContent className="group relative">
        <div className="absolute right-3 top-3 flex">
          <Button
            variant="outline"
            iconElement={<FaRegClipboard />}
            onClick={() => handleCopy({ text: content.text })}
            disabled={editMode || !content.text?.trim()}
          >
            {copied ? 'gekopieerd' : 'kopieer'}
          </Button>
        </div>
        <div ref={contentRef} className={`${styles.content} ${props.modificationEnabled && styles.edit}`}>
          {editMode ? (
            <EditableText
              text={content.text}
              json={content.json}
              onChange={(text: string, json: Descendant[]) => setContent({ text, json })}
            />
          ) : content.json.length > 0 ? (
            renderNodes(content.json)
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content.text }}></div>
          )}
        </div>
        {props.modificationEnabled ? (
          <div className={`hidden group-hover:flex ${styles.buttons} ${editMode && styles.edit}`}>
            {editMode ? (
              <>
                {props.onDelete ? (
                  <Button variant="ghost" icon="delete" onClick={() => props.onDelete && props.onDelete()}>
                    verwijderen
                  </Button>
                ) : undefined}
                <Button icon="save" onClick={() => onSave()}>
                  opslaan
                </Button>
                <Button variant="outline" icon="cancel" onClick={() => onCancel()}>
                  annuleren
                </Button>
              </>
            ) : (
              <Button variant="outline" icon="edit" onClick={() => setEditMode(true)}>
                bewerken
              </Button>
            )}
          </div>
        ) : undefined}
      </AccordionContent>
    </AccordionItem>
  )
}

export default ArticleAccordion
