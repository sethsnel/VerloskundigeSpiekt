import { Article, Tag, UpsertTag } from '../../../schema/article'
import upsertArticle from '../articles/upsert-article'
import upsertTag from './upsert-tag'

export const addTagsToArticle = async (tags: UpsertTag[], article: Article) => {
  const upsertTagsPromise = tags.map(async (tag) => {
    // Ensure articles array exists
    if (!tag.articles) {
      tag.articles = []
    }

    // Add article reference to tag if it doesn't exist already
    const existingArticleIndex = tag.articles.findIndex(a => a.id === article.id)

    if (existingArticleIndex === -1) {
      tag.articles.push({
        id: article.id,
        name: article.name
      })
    }

    return await upsertTag(tag)
  })

  const upsertTags = await Promise.all(upsertTagsPromise)

  // Add tag references to article
  const newTagIds = upsertTags
    .map(tag => tag.id)
    .filter(tagId => !article.tagIds || !article.tagIds.includes(tagId))

  article.tagIds = [...(article.tagIds ?? []), ...newTagIds]

  const upsertedArticle = await upsertArticle(article)

  return { tags: upsertTags, article: upsertedArticle }
}

export const removeTagsFromArticle = async (tags: Tag[], article: Article) => {
  const upsertTagsPromise = tags.map(async (tag) => {
    // Remove article from tag's articles array
    tag.articles = tag.articles.filter(a => a.id !== article.id)

    return await upsertTag(tag)
  })

  const upsertTags = await Promise.all(upsertTagsPromise)

  // Remove tag IDs from article
  if (article.tagIds) {
    const tagIdsToRemove = tags.map(tag => tag.id)
    article.tagIds = article.tagIds.filter(tagId => !tagIdsToRemove.includes(tagId))
  }

  const upsertedArticle = await upsertArticle(article)

  return { tags: upsertTags, article: upsertedArticle }
}
