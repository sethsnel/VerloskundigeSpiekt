import { expect, test } from 'vitest'
import { apiQueryKeys, isTenantQuery } from '../../lib/api/query-keys'
test('all private domain query keys are classified as tenant scoped', () => { for (const key of [apiQueryKeys.members(), apiQueryKeys.invitations(), apiQueryKeys.pages(), apiQueryKeys.templates(), apiQueryKeys.contacts(), apiQueryKeys.files(), apiQueryKeys.privateSearch()]) expect(isTenantQuery(key)).toBe(true); expect(isTenantQuery(apiQueryKeys.practices())).toBe(false) })
