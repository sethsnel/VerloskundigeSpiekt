import styles from './accordion.module.scss'

interface EditableHeaderProps {
  name: string
  onChange: (newValue: string) => void
}

export const EditableHeader = ({ name, onChange }: EditableHeaderProps) => {
  return <h2 className={`${styles.edit} ${styles.name}`}>
    <input type="text" value={name} onChange={(e) => onChange(e.target.value)} />
  </h2 >
}