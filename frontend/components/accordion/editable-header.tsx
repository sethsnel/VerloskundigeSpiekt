import { useState } from "react"

import styles from './accordion.module.scss'

interface EditableHeaderProps {
  name: string
  onChange: (newValue: string) => void
}

export const EditableHeader = ({ name, onChange }: EditableHeaderProps) => {
  const [editName, setName] = useState<string>(name)

  const updateName = (newName: string) => {
    setName(newName)
    onChange(newName)
  }

  //onInput={(e) => updateName((e.target as HTMLElement).innerHTML ?? 'Geef een naam op')}>

  return <h2 className={`${styles.edit} ${styles.name}`}
    contentEditable={true} suppressContentEditableWarning={true}
    onBlur={(e) => updateName((e.target as HTMLElement).innerHTML ?? 'Geef een naam op')}>
    {editName}
  </h2 >
}