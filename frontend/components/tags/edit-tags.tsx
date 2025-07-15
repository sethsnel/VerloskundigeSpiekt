import { useState } from "react"
import { TiDelete } from "react-icons/ti"

import { useUser } from '../../lib/auth/use-user'
import { UpsertTag } from "../../schema/article"
import useQueryTags from '../../lib/hooks/tags/useQueryTags'
import { Button } from '../button'

import styles from './edit-tags.module.scss'

interface EditTagsProps {
  articleTags: UpsertTag[]
  onTagAdd: (tag: UpsertTag) => void
  onTagRemove: (tag: UpsertTag) => void
  saveTags: (tags: UpsertTag[]) => void
  closeModal: () => void
}

export default function EditTags({ articleTags, onTagAdd, onTagRemove, saveTags, closeModal }: EditTagsProps) {
  const { user } = useUser()
  const { queryTags } = useQueryTags()
  const allTags = queryTags.data ?? []
  const [newTag, setNewTag] = useState<string>('')
  const [newTags, setNewTags] = useState(articleTags)

  if (!user?.hasContributeRights()) {
    return <>Je hebt onvodloende rechten om tags te wijzigen.</>
  }

  const actions = [
    { label: "Opslaan", type: 'save', onClick: () => saveTags(newTags) },
    { label: "Annuleer", type: 'cancel', onClick: closeModal }
  ]
  const actionButtons = actions.map(action => (
    <Button variant="outline" key={action.label} icon={action.type as 'save' | 'cancel'} onClick={() => { action.onClick && action.onClick() }}>
      {action.label}
    </Button>
  ))

  const onAddTagClick = () => {
    let tag: UpsertTag | undefined = allTags.find(t => t.name === newTag)
    if (!tag) {
      tag = { name: newTag, articles: [] }
    }

    if (newTags.map(t => t.name).includes(newTag)) {
      return
    }

    setNewTags([...newTags, tag])
    onTagAdd(tag)
  }

  const onTagRemoveClick = (tag: UpsertTag) => {
    const indexOfTag = newTags.findIndex(t => t.name === tag.name)
    if (indexOfTag > -1) {
      newTags.splice(indexOfTag, 1)
      setNewTags([...newTags])
      onTagRemove(tag)
    }
  }

  return <>
    <div className='d-flex align-items-center justify-content-center gap-3 m-1'>
      {
        newTags.map(tag => {
          return <span key={tag.name} className={`badge rounded-pill text-bg-light ${styles.remove_tag}`} onClick={() => onTagRemoveClick(tag)}>{tag.name} <TiDelete /></span>
        })
      }
    </div>
    <div className="grid mt-5 mb-5">
      <div className="input-group g-col-6 g-start-4">
        <span className="input-group-text">Tag toevoegen:</span>
        <input className="form-control" list="allTags" id="tagList" placeholder="Naam van tag..." onChange={(e) => setNewTag(e.currentTarget.value)} />
        <Button variant="default" className="btn btn-primary" type="button" icon="add" onClick={onAddTagClick}>Voeg toe</Button>
      </div>
    </div>
    <datalist id="allTags">
      {
        allTags.map(tag => {
          return <option key={tag.name} value={tag.name} />
        })
      }
      {newTag && newTag.length > 2 && !allTags.map(t => t.name.toLowerCase()).some(t => t.includes(newTag.toLowerCase())) && <option value={newTag} />}
    </datalist>
    <div className="modal-footer">
      {actionButtons}
    </div>
  </>
}