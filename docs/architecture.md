# Platform architecture

## Current repository stage

The existing customer frontend is now the `@senderplus/customer-web` npm workspace
under `apps/customer-web/`. Django stays in `backend/` so the deployed API root,
Python imports, migrations, and application labels continue to work unchanged.
Driver and operations directories contain planning notes only. `packages/` is
reserved for actual shared libraries as those apps are built.

## Agreed target

| Concern | Direction |
| --- | --- |
| Customer client | Existing React/Vite web app; a separate mobile client can be added later |
| Driver client | Expo/React Native with local persistence and queued synchronization |
| Staff client | Separate operations web dashboard |
| API and business data | Shared Django REST API and Render PostgreSQL |
| Identity | Supabase Auth integration behind an opt-in rollout switch |
| Authorization | Django-enforced customer, driver, and staff permissions |
| Photos and voice | Private Supabase Storage; existing Cloudinary assets need no migration |
| Supabase organization | Dedicated Senderplus organization, one project for Auth and Storage |
| Development/launch | Supabase Free for testing; Pro planned for launch |
| Addressing/navigation | Google Maps plus GhanaPostGPS, pins, landmarks, and instructions |
| Delivery communication | Text and short voice messages in both directions |

These are implementation goals, not capabilities supplied by the folder move.
The GhanaPostGPS wrapper still needs validation before production reliance.

## Dependency and release boundaries

- Applications may depend on packages; packages must not import applications.
- Keep each app's dependencies in its own manifest and use the root lockfile.
  React versions and platform-specific tooling need not be identical across apps.
- Keep Django's Python dependencies and migrations in `backend/`.
- Clients access delivery data through Django. Supabase integration must preserve
  Django's authority over business permissions and private-media access.
- Keep native storage, GPS, recording, and background execution in the mobile app.
- Keep offline message state explicit. Connectivity loss queues work; it does not
  deliver messages. Replays need idempotency and permission checks in Django.
- Release clients independently from the same repo. Separate app-store identifiers,
  builds, and credentials do not require separate repositories.

## Next implementation stages

1. Verify and activate the identity/role integration using [authentication.md](authentication.md),
   then complete account migration and staff authentication hardening.
2. Integrate private media storage and remove Cloudinary code/dependencies.
3. Define delivery assignments, allowed transitions, and audit/event history.
4. Build driver and operations workflows against that API.
5. Add mapping/address resolution, delivery conversations, and offline sync.

Design persisted events and idempotent operations with the initial workflows.
Add workers and additional infrastructure when concrete workloads require them;
this restructure does not provision services or introduce microservices.
