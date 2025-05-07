import Link from 'next/link'

import { useMutationTags } from "../../lib/hooks/tags"
import useTagsModal from "../../lib/hooks/tags/useTagsModal"
import { Article, Tag, UpsertTag } from "../../schema/article"
import { Button } from "../button"
import { useUser } from '../../lib/auth/use-user'
import styles from './tags.module.scss'

interface EditableTagsProps {
  article: Article
  tags: Tag[]
}

export default function EditableTags({ article, tags }: EditableTagsProps) {
  const { addTagsToArticleMutation, removeTagsFromArticleMutation } = useMutationTags(article)
  const onSaveTags = (newTags: UpsertTag[]) => {
    const currentTags = article.tagIds ?? []
    const tagsToAdd = newTags.filter(tag => !tag.id || !currentTags.includes(tag.id))
    const tagIdsToRemove = currentTags.filter(tagId => !newTags.map(t => t.id ?? '').includes(tagId))
    const tagsToRemove = tags.filter(tag => tagIdsToRemove.includes(tag.id ?? ''))

    if (tagsToAdd.length > 0) {
      addTagsToArticleMutation.mutate(tagsToAdd)
    }

    if (tagsToRemove.length > 0) {
      removeTagsFromArticleMutation.mutate(tagsToRemove)
    }
  }
  const tagsConnected = tags.filter(tag => article.tagIds && article.tagIds.includes(tag.id))
  const { showTagsModal } = useTagsModal(tagsConnected, onSaveTags)
  const { user } = useUser()

  const hasEditRights = user?.hasContributeRights?.() ?? false

  return (
    <div className={styles.tagContainer}>
      <div className='d-flex align-items-center m-1 fs-5 p-3 justify-content-center'>
        {
          tagsConnected.map(tag => {
            return <Link href={`/tags/${tag.id}`} key={tag.id} className={styles.tag}>
              <span key={tag.id} className="badge rounded-pill text-bg-light">{tag.name}</span>
            </Link>
          })
        }
        {
          tagsConnected.length === 0 && (
            <span className="badge rounded-pill text-bg-light">Nog geen tags</span>
          )
        }
      </div>
      {hasEditRights && (
        <div className={styles.buttonContainer}>
          <Button onClick={showTagsModal} icon='edit' className='m-3 btn btn-info'>edit tags</Button>
        </div>
      )}
    </div>
  )
}