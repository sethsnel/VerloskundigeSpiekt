import { Article, Tag, UpsertTag } from '../../../schema/article'
import upsertArticle from '../articles/upsert-article'
import upsertTag from './upsert-tag'

const addTagsToArticle = async (tags: UpsertTag[], article: Article) => {
  const upsertTagsPromise = tags.map(async (tag) => {
    tag.articleIds = [...tag.articleIds, article.id]
    return await upsertTag(tag)
  })

  const upsertTags = await Promise.all(upsertTagsPromise)
  const newTagIds = upsertTags.map(tag => tag.id)
  article.tagIds = [...article.tagIds ?? [], ...newTagIds]
  const upsertedArticle = await upsertArticle(article)
  return { tags: upsertTags, article: upsertedArticle }
}

const removeTagsFromArticle = async (tags: Tag[], article: Article) => {
  const upsertTagsPromise = tags.map(async (tag) => {
    const articleIndex = tag.articleIds.indexOf(article.id)
    if (articleIndex > -1) {
      tag.articleIds.splice(articleIndex, 1)
    }

    const tagIndex = (article.tagIds ?? []).indexOf(tag.id)
    if (tagIndex > -1 && article.tagIds) {
      article.tagIds.splice(tagIndex, 1)
    }

    return await upsertTag(tag)
  })

  const upsertTags = await Promise.all(upsertTagsPromise)
  const upsertedArticle = await upsertArticle(article)
  return { tags: upsertTags, article: upsertedArticle }
}

export default { addTagToArticle: addTagsToArticle, removeTagFromArticle: removeTagsFromArticle }