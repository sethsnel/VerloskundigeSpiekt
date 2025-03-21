import useTagsModal from "../../lib/hooks/files/useTagsModal"
import { Button } from "../button"

interface EditableTagsProps {
  tags: string[]
  onSave: (newTags: string[]) => void
}

export default function EditableTags({ tags, onSave }: EditableTagsProps) {
  const { showTagsModal } = useTagsModal(tags, onSave)

  return <>
    <div className='d-flex align-items-center m-1'>
      {
        tags.map(tag => {
          return <span key={tag} className="badge rounded-pill text-bg-light">{tag}</span>
        })
      }
    </div>
    {/* Only show button when user has contribute rights */}
    <Button onClick={showTagsModal} icon='edit' className='m-3 btn btn-info'>edit tags</Button>
  </>
}