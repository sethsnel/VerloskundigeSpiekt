import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { beforeEach, expect, test, vi } from 'vitest'
import TagsClient from '../../app/tags/tags-client'

vi.mock('../../lib/api/generated', () => ({ generatedApi: { listTags: vi.fn(async () => [{ id: 'tag-1', name: 'Clinical', articleIds: ['article-1'], version: 'v' }]), listArticles: vi.fn(async () => [{ id: 'article-1', slug: 'article', title: 'Article', tagIds: ['tag-1'] }]) } }))
let client: QueryClient
beforeEach(() => { client = new QueryClient({ defaultOptions: { queries: { retry: false } } }) })
test('renders API-backed tags and article counts', async () => { render(<QueryClientProvider client={client}><TagsClient /></QueryClientProvider>); expect(await screen.findByText('Clinical')).toBeInTheDocument(); expect(screen.getByText('1 artikelen')).toBeInTheDocument() })
