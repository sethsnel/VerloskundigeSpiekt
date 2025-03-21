import { useUser } from '../../lib/auth/use-user'
import { useState } from "react"
import { Tag, UpsertTag } from "../../schema/article"
import useQueryTags from '../../lib/hooks/tags/useQueryTags'

interface EditTagsProps {
  tags: UpsertTag[]
  onTagSelect: (tag: Tag | UpsertTag) => void
}

export default function EditTags({ tags, onTagSelect }: EditTagsProps) {
  const { user } = useUser()
  const { queryTags } = useQueryTags()
  const allTags = queryTags.data ?? []
  const [newTag, setNewTag] = useState<string>('')

  if (!user?.hasContributeRights()) {
    return <></>
  }

  return <>
    <div className='d-flex align-items-center m-1'>
      {
        tags.map(tag => {
          return <span key={tag.id} className="badge rounded-pill text-bg-light">{tag.name}</span>
        })
      }
    </div>
    <label htmlFor="tagList" className="form-label">Kies tags:</label>
    <input className="form-control" list="allTags" id="tagList" placeholder="Voeg tag toe..." value={newTag}
      onChange={(e) => setNewTag(e.currentTarget.value)}
      onKeyDown={function (e) { e.key === 'Enter' && onTagSelect({ id: allTags[0].id, name: newTag, articleIds: [] }) }
      }
    />
    <datalist id="allTags">
      {
        allTags.map(tag => {
          return <option key={tag.id} value={tag.name} onClick={() => { console.info('click!'); onTagSelect(tag) }} />
        })
      }
      {newTag && newTag.length > 2 && !allTags.map(t => t.name.toLowerCase()).some(t => t.includes(newTag.toLowerCase())) && <option value={newTag} onClick={() => onTagSelect({ name: newTag, articleIds: [] })} />}
    </datalist>
  </>
}