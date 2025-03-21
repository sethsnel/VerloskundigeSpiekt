import { Button } from "../button"
import { useUser } from '../../lib/auth/use-user'
import { useState } from "react"

interface EditTagsProps {
  tags: string[]
  allTags: string[]
  onTagSelect: (tag: string) => void
}

export default function EditTags({ tags, allTags, onTagSelect }: EditTagsProps) {
  const { user } = useUser()
  const [newTag, setNewTag] = useState<string>('')

  if (!user?.hasContributeRights()) {
    return <></>
  }

  return <>
    <div className='d-flex align-items-center m-1'>
      {
        tags.map(tag => {
          return <span key={tag} className="badge rounded-pill text-bg-light">{tag}</span>
        })
      }
    </div>
    <label htmlFor="tagList" className="form-label">Datalist example</label>
    <input className="form-control" list="allTags" id="tagList" placeholder="Voeg tag toe..." value={newTag} onChange={(e) => setNewTag(e.currentTarget.value)} />
    <datalist id="allTags">
      {
        allTags.map(tag => {
          return <option key={tag} value={tag} onClick={() => onTagSelect(tag)} />
        })
      }
      {newTag && newTag.length > 2 && !allTags.map(t => t.toLowerCase()).some(t => t.includes(newTag.toLowerCase())) && <option value={newTag} onClick={() => onTagSelect(newTag)} />}
    </datalist>
  </>
}