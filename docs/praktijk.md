# Praktijk (teams) functionality

## User-facing pages
- **`/praktijk`**: dashboard for creating a praktijk, switching active practice, managing members, and sending invites.
- **`/praktijk/adressenboekje`**: shared address book for practices.

## Firestore collections
- `praktijken`: basic practice info (name/address/phone, ownerId).
- `praktijkMembers`: membership records with roles (`admin` or `user`).
- `praktijkInvites`: email-based invitations with status (`pending`).
- `praktijkAddresses`: shared address book entries.
- `userProfiles`: per-user state storing `activePraktijkId`.

## React Query usage
All reads and writes are routed through React Query hooks (`frontend/lib/hooks/praktijken`) to keep the UI consistent and cache-aware.

## Notes
- The dashboard uses the active praktijk stored in `userProfiles` to scope member lists, invites, and address book entries.
- New praktijken are created with the current user as an admin member.
