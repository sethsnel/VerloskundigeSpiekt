import TagsClient from '../tags-client'
export default async function TagPage({ params }: { params: Promise<{ tagId: string }> }) { const { tagId } = await params; return <TagsClient tagId={tagId} /> }
