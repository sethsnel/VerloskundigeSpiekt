import { useMutationTags } from "../../lib/hooks/tags"
import useTagsModal from "../../lib/hooks/tags/useTagsModal"
import { Article, Tag, UpsertTag } from "../../schema/article"
import { Button } from "../button"

interface EditableTagsProps {
  article: Article
  tags: Tag[]
  //onSave: (newTags: UpsertTag[]) => void
}

export default function EditableTags({ article, tags }: EditableTagsProps) {
  const { addTagToArticleMutation, removeTagFromArticleMutation } = useMutationTags(article)
  const onSaveTags = (newTags: UpsertTag[]) => {
    const currentTags = article.tagIds ?? []
    const tagsToAdd = newTags.filter(tag => !tag.id || !currentTags.includes(tag.id))
    const tagIdsToRemove = currentTags.filter(tagId => !newTags.map(t => t.id ?? '').includes(tagId))
    const tagsToRemove = tags.filter(tag => tagIdsToRemove.includes(tag.id ?? ''))

    if (tagsToAdd.length > 0) {
      addTagToArticleMutation.mutate(tagsToAdd)
    }

    if (tagsToRemove.length > 0) {
      removeTagFromArticleMutation.mutate(tagsToRemove)
    }
    //onSave && onSave(tags)
  }
  const tagsConnected = tags.filter(tag => article.tagIds && article.tagIds.includes(tag.id))
  const { showTagsModal } = useTagsModal(tagsConnected, onSaveTags)

  return <>
    <div className='d-flex align-items-center m-1'>
      {
        tagsConnected.map(tag => {
          return <span key={tag.id} className="badge rounded-pill text-bg-light">{tag.name}</span>
        })
      }
    </div>
    {/* Only show button when user has contribute rights */}
    <Button onClick={showTagsModal} icon='edit' className='m-3 btn btn-info'>edit tags</Button>
  </>
}