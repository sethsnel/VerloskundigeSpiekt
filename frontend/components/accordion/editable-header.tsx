import styles from './accordion.module.scss'

interface EditableHeaderProps {
  name: string
  editMode: boolean
  onChange: (newValue: string) => void
}

// &.edit {
//   cursor: text;

//   &:hover,
//   &:active {
//     background-color: inherit;
//   }
// }
export const EditableHeader = ({ name, editMode, onChange }: EditableHeaderProps) => {
  return (
    <h2 className="w-full text-left first-letter:uppercase text-xl">
      {editMode ? (
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          className="w-full outline-hidden first-letter:uppercase border-b-1 hover:border-primary"
        />
      ) : (
        name
      )}
    </h2>
  )
}
