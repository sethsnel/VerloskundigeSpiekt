export const getArticleQueryKey = (articleId: string) => ['article', articleId]
export const getTagQueryKey = (tagId?: string) => ['tag', tagId]
export const getTagsQueryKey = (tagIds?: string[]) => ['tags', ...tagIds || []]