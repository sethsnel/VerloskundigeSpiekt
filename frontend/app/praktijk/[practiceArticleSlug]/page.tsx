import PracticeArticlePage from './practice-article-page'

const allowedSlugs = ['contacten', 'ziekenhuizen', 'sjablonen', 'assistenten', 'documenten']

export function generateStaticParams() {
  return allowedSlugs.map((practiceArticleSlug) => ({ practiceArticleSlug }))
}

export default async function Page({ params }: { params: Promise<{ practiceArticleSlug: string }> }) {
  const { practiceArticleSlug } = await params
  return <PracticeArticlePage slug={practiceArticleSlug} />
}
