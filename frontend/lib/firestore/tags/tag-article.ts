import { Article, Tag, UpsertTag } from '../../../schema/article'
import upsertArticle from '../articles/upsert-article'
import upsertTag from './upsert-tag'

const addTagToArticle = async (tag: UpsertTag, article: Article) => {
  tag.articleIds = [...tag.articleIds, article.id]
  const upsertedTag = await upsertTag(tag)

  article.tagIds = [...article.tagIds, upsertedTag.id]
  const upsertedArticle = await upsertArticle(article)
  return { tag: upsertedTag, article: upsertedArticle }
}

const removeTagFromArticle = async (tag: Tag, article: Article) => {
  const articleIndex = tag.articleIds.indexOf(article.id)
  if (articleIndex > -1) {
    tag.articleIds.splice(articleIndex, 1)
  }

  const tagIndex = article.tagIds.indexOf(tag.id)
  if (tagIndex > -1) {
    article.tagIds.splice(tagIndex, 1)
  }

  const upsertedTag = await upsertTag(tag)
  const upsertedArticle = await upsertArticle(article)
  return { tag: upsertedTag, article: upsertedArticle }
}

export default { addTagToArticle, removeTagFromArticle }