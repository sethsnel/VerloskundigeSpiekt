import { expect, test } from '@playwright/test'
test('public domain traffic stays on the v1 API boundary', async ({ page }) => {
  const domainRequests: string[] = []
  await page.route('http://localhost:8080/api/v1/**', async route => { const url = route.request().url(); domainRequests.push(url); if (url.endsWith('/tags')) await route.fulfill({ json: [{ id: 'tag-1', name: 'Clinical', articleIds: ['article-1'], version: 'v' }] }); else if (url.endsWith('/articles')) await route.fulfill({ json: [{ id: 'article-1', slug: 'article', title: 'Article', position: 0, headerUrl: null, isPublished: true, documentJson: '[]', sections: [], tagIds: ['tag-1'], version: 'v' }] }); else await route.fulfill({ status: 404, json: {} }) })
  await page.goto('/tags'); await expect(page.getByText('Clinical')).toBeVisible(); expect(domainRequests.length).toBeGreaterThanOrEqual(2); expect(domainRequests.every(url => url.includes('/api/v1/'))).toBe(true)
})
