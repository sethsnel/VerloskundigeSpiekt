import type { Metadata } from 'next'
import { getChannelLabels } from 'content/labels'
import TagsClient from './tags-client'
const labels = getChannelLabels()
export const metadata: Metadata = { title: `${labels.websiteTitle} - tags`, description: 'Bladeren door alle tags en onderwerpen' }
export default function TagsPage() { return <TagsClient /> }
