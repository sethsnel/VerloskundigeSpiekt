import Link from 'next/link'

import { useMutationTags } from "../../lib/hooks/tags"
import useTagsModal from "../../lib/hooks/tags/useTagsModal"
import { Article, Tag, UpsertTag } from "../../schema/article"
import { Button } from "../button"
import { useUser } from '../../lib/auth/use-user'
import styles from './tags.module.scss'
import { Badge } from '@/components/ui/badge'

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
    <div className={`group ${styles.tagContainer}`}>
      <div className='flex items-center justify-center gap-2 m-1 p-3'>
        {
          tagsConnected.map(tag => {
            return <Badge asChild key={tag.id} className='text-sm'><Link href={`/tags/${tag.id}`} key={tag.id}>{tag.name}</Link></Badge>
          })
        }
        {
          tagsConnected.length === 0 && (
            <span className="badge rounded-pill text-bg-light">Nog geen tags</span>
          )
        }
      </div>
      {hasEditRights && (
        <div className="hidden group-hover:block absolute right-0 top-0 translate-y-1/4">
          <Button variant="ghost" onClick={showTagsModal} icon='edit' className='m-3'>edit tags</Button>
        </div>
      )}
    </ div>
  )
}