# Praktijken implementation plan

## Milestones
1. **Data model + Firebase helpers**
   - Define Firestore document shapes for praktijken, members, invites, address book entries, and user profile settings (active praktijk).
   - Add Firestore helpers under `frontend/lib/firestore/praktijken` and corresponding React Query keys.

2. **React Query hooks + state flows**
   - Add hooks that expose practice list, active praktijk, member list, invites, and address book data through React Query.
   - Ensure mutations (create praktijk, invite member, set active praktijk, add address book entry) invalidate the relevant queries.

3. **UI pages and navigation**
   - Add `/praktijk` dashboard page with create/switch practice, details, member list, and invite form.
   - Add `/praktijk/adressenboekje` page with shared address book CRUD (create + list).
   - Add a “Praktijk” entry in the sidebar navigation.

## Design decisions
- **Firestore collections**
  - `praktijken`: basic practice info (name/address/phone, ownerId, timestamps).
  - `praktijkMembers`: membership records (praktijkId, userId, role, email/displayName).
  - `praktijkInvites`: pending invitations (praktijkId, email, role, status).
  - `praktijkAddresses`: shared address book entries (praktijkId, contact details).
  - `userProfiles`: per-user state (activePraktijkId).
- **React Query as intermediary**
  - All reads/writes go through React Query queries/mutations to keep UI state consistent.
- **Routing**
  - Dashboard at `/praktijk` and address book at `/praktijk/adressenboekje`.

## To-dos
- [ ] Create schema types for Praktijk, PraktijkMember, PraktijkInvite, PraktijkAddress, PraktijkWithRole.
- [ ] Implement Firestore helpers for CRUD in `frontend/lib/firestore/praktijken`.
- [ ] Add React Query keys and hooks for praktijken data.
- [ ] Build `/praktijk` dashboard page with create/switch/invite/member list UI.
- [ ] Build `/praktijk/adressenboekje` page with add/list shared addresses UI.
- [ ] Add “Praktijk” to the sidebar navigation menu.
- [ ] Update docs if needed and verify pages render.
