# Praktijken plan

## Milestones
1. **Data model + Firestore access layer**
   - Define new document types for praktijken, members, invites, and adressenboekje items.
   - Add Firestore helpers for CRUD and membership/active praktijk management.
2. **React Query hooks + user state**
   - Create query/mutation hooks for praktijken, invites, members, address book, and active praktijk switching.
   - Add query key helpers for consistent cache invalidation.
3. **UI + routing**
   - Add a Praktijk dashboard page with praktijk details, member list, invites, and active praktijk switcher.
   - Add an Adressenboekje page to list and create shared addresses.
   - Add navigation entries to reach the new pages.
4. **Documentation**
   - Document the new Praktijk data model and pages in the frontend README.

## Design decisions
- **Firestore structure**
  - `praktijken/{praktijkId}` holds praktijk metadata and address.
  - `praktijken/{praktijkId}/members/{memberId}` stores member role and identity.
  - `praktijken/{praktijkId}/invites/{inviteId}` stores pending invites by email.
  - `praktijken/{praktijkId}/adressenboekje/{entryId}` stores shared address book entries.
  - `userSettings/{userId}` stores the active `praktijkId` for quick switching.
- **Membership lookup**
  - Use `collectionGroup('members')` to find praktijken for a user and then fetch the parent praktijk docs.
- **Auth source**
  - Use the existing `useUser` hook for the logged-in user id/email.
- **React Query**
  - New query keys are added in `frontend/lib/react-query` and used by all praktijken hooks for cache invalidation.

## To-dos
- [ ] Add new schema types for praktijken, members, invites, and address book entries.
- [ ] Implement Firestore helpers for:
  - Creating a praktijk and initial admin member.
  - Listing praktijken for a user.
  - Switching the active praktijk in `userSettings`.
  - Managing members and invites.
  - Managing adressenboekje entries.
- [ ] Add React Query hooks for the above helpers.
- [ ] Build `/praktijk` dashboard page with:
  - Praktijk creation form.
  - Active praktijk switcher.
  - Praktijk details + address.
  - Member list and invite form.
- [ ] Build `/praktijk/adressenboekje` page with:
  - Entry list.
  - Entry creation form.
- [ ] Add navigation items for Praktijk and Adressenboekje.
- [ ] Document the feature and data model in `frontend/README.md`.
