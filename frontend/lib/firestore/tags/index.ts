import tagArticle from './tag-article'
import getTags from './get-tags'
import upsertTag from './upsert-tag'

export const mutateTags = {
  addTagToArticle: tagArticle.addTagsToArticle,
  removeTagFromArticle: tagArticle.removeTagsFromArticle
}

export {
  getTags,
  upsertTag
}
