import { addTagsToArticle, removeTagsFromArticle } from './tag-article'
import getTags from './get-tags'
import upsertTag from './upsert-tag'

export const mutateTags = {
  addTagsToArticle,
  removeTagsFromArticle
}

export {
  getTags,
  upsertTag
}