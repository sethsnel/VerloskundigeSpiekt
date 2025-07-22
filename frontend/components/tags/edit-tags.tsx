import { useState } from "react"
import { TiDelete } from "react-icons/ti"

import { DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

import { useUser } from '../../lib/auth/use-user'
import { UpsertTag } from "../../schema/article"
import useQueryTags from '../../lib/hooks/tags/useQueryTags'
import { Button } from '../button'

import styles from './edit-tags.module.scss'
import { Input } from "../ui/input"


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
    return <>Je hebt onvoldoende rechten om tags te wijzigen.</>
  }

  const actions = [
    { label: "Annuleer", type: 'cancel', variant: 'outline' as 'outline' | 'default', onClick: closeModal },
    { label: "Opslaan", type: 'save', variant: 'default' as 'outline' | 'default', onClick: () => saveTags(newTags) }
  ]
  const actionButtons = actions.map(action => (
    <Button variant={action.variant} key={action.label} icon={action.type as 'save' | 'cancel'} onClick={() => { action.onClick && action.onClick() }}>
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
    <div className='flex justify-center gap-3 m-1'>
      {
        newTags.map(tag => {
          return <Badge key={tag.name} className="text-sm" onClick={() => onTagRemoveClick(tag)}>
            {tag.name} <TiDelete />
          </Badge>
        })
      }
    </div>
    <div className="mt-5 mb-5 items-center flex flex-col">
      <div className="sm:w-md items-start">
        <label htmlFor="tagList">Tag toevoegen:</label>
      </div>
      <div className="flex sm:w-md gap-1">
        <Input list="allTags" id="tagList" placeholder="Naam van tag..." onChange={(e) => setNewTag(e.currentTarget.value)} />
        <Button variant="default" type="button" icon="add" onClick={onAddTagClick}>Voeg toe</Button>
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
    <DialogFooter>
      {actionButtons}
    </DialogFooter>
  </>
}