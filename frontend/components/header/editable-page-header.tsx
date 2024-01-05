import { useState } from 'react'
import { ImCancelCircle } from 'react-icons/im'
import { IoSaveOutline } from 'react-icons/io5'

import { useUser } from '../../lib/auth/use-user'
import { Icon } from '../icon'

import styles from './editable-page-header.module.scss'

interface EditablePageHeaderProps {
  title: string
  onSave: (newTitle: string) => void
}

const EditablePageHeader = ({ title, onSave }: EditablePageHeaderProps) => {
  const { user } = useUser()
  const [editMode, setEditMode] = useState<boolean>(false)
  const [updatedTitle, setupdatedTitle] = useState<string>(title)

  if (editMode) {
    return <h1 className={`${styles.title} ${styles.editable}`}>
      <input autoFocus type="text" value={updatedTitle} onChange={(e) => setupdatedTitle(e.target.value)} />
      <button onClick={() => { setEditMode(false); setupdatedTitle(title) }}>
        <Icon icon={ImCancelCircle} />
      </button>
      <button onClick={() => { setEditMode(false); onSave(updatedTitle) }}>
        <Icon icon={IoSaveOutline} />
      </button>
    </h1 >
  } else {
    return <h1 className={`${styles.title} ${user?.hasContributeRights() && styles.editable}`} onClick={() => setEditMode(user?.hasContributeRights() ?? false)}>
      <span>
        {title}
      </span>
    </h1>
  }
}

export default EditablePageHeader