# Sender+ product delivery roadmap

Planning baseline: 23 November 2026. Reviewed against the source included in merged PR #50 (main commit 587e599). This is a proposed implementation sequence, not a claim that the features below exist.

## Outcome and release boundaries

Deliver three independently released clients using one Django API:

- Customer web: book, manage and track deliveries, communicate, obtain delivery confirmation.
- Driver Android/iOS app: receive assignments, navigate, record custody/status/proof, communicate and recover from connectivity loss.
- Operations web: dispatch, hub handovers, exceptions, support, driver oversight and reporting. Django admin remains an internal maintenance tool.

Customer app-store releases are an explicit later milestone, not an automatic conversion of the existing React website. Share API contracts and business utilities; implement native screens separately where needed. Driver and customer mobile applications get separate app identifiers and releases in the same repository.

## Verified starting point

- Customer React/Vite app exists under apps/customer-web, including submission, tracking, profile and authentication pages.
- Driver and operations directories contain planning READMEs only.
- Supabase identity and Django role integration are merged; hosted activation and real email/session testing remain pending.
- Render PostgreSQL remains the business database. Do not move delivery tables to Supabase as part of this roadmap.
- Package has sender/recipient details, photo and four statuses: waiting_bus, en_route_campus, at_campus_hub, delivered.
- Package has no owner or driver assignment relationship yet.
- Submission and tracking APIs allow anonymous access. Tracking currently serializes contact details, addresses and photo information. Restrict this before broad testing.
- Status advancement has an operations-wide permission; it has no assignment-specific driver workflow or event ledger.
- Cloudinary remains in application code. Private Supabase Storage replacement is not implemented.

## Delivery principles

Build one usable end-to-end workflow before expanding features. Each milestone should have a reviewable PR, migration/compatibility notes where relevant, automated checks, and a short demonstration. No production authentication switch is implied by this document.

Use additive schema changes first. Existing deliveries with unknown ownership remain unclaimed; never infer ownership from unverified phone/email matches. Preserve existing statuses until an explicit migration and frontend compatibility mapping are implemented.

Use Django as the authority for account roles, service-area scope, assignments and file permissions. A hidden button is not permission enforcement. Never expose server-side storage secrets in any client.

## Milestones

### 1. Secure delivery ownership and assignment foundation — start now

Work:
- Add nullable customer owner, delivery assignment records and assignment history.
- Set owner from the authenticated request; do not accept client-supplied owner or role values.
- Provide paginated customer-owned and driver-assigned delivery endpoints.
- Allow authorized dispatchers/managers to assign only eligible active drivers; restrict ordinary users from assignment changes.
- Scope list, detail and mutation requests consistently. On reassignment, remove the former driver's server access immediately.
- Define explicit hub/service-area membership for operational access; a global admin is a deliberate exception. Avoid granting all staff unlimited dispatch powers by default.
- Separate minimal public tracking from private detail. Public responses must exclude contacts, exact addresses, private photos/messages and driver location. Add throttling and stronger identifiers for new public tracking links.
- Keep legacy unowned records available to authorized operations staff. Decide guest booking policy explicitly; any retained guest path needs abuse controls and a verified claim process.

Acceptance:
- Customer A cannot list/read/change customer B's deliveries, even using a known ID.
- Driver A cannot access driver B's assignment or assign themselves a delivery.
- Reassignment and role/account revocation affect subsequent API access.
- Public tracking returns only approved status information.
- Tests cover unauthorized requests, legacy rows and migration compatibility.

### 2. Delivery lifecycle, custody and audit trail

Work:
- Define booking, pickup, transport, hub receipt, out-for-delivery, completion, cancellation and return transitions; keep issue status distinct where it does not replace physical custody.
- Separate the overall shipment from its delivery legs/tasks so bus-station pickup, campus-hub handover and last-mile delivery can have different drivers.
- Record actor, server time, device-reported time, previous/new status, assignment and reason in an append-only business event history.
- Add optimistic versions and transactional updates. Require idempotency keys for repeatable status/assignment requests; same key with different content must fail.
- Require reasons for failed attempts, reassignment and administrative corrections. Corrections add events instead of rewriting history.
- Define completion evidence: recipient acknowledgement/code and/or proof photo according to service rules. Do not assume SMS is free.
- Add a minimum internal dispatch workflow in Django admin while the dedicated dashboard is being built.

Acceptance: duplicated requests create one event; competing updates cannot silently overwrite each other; invalid transitions are rejected; handover history identifies custody.

### 3. First complete workflow across all three clients

Customer:
- Replace the largely promotional home screen with active deliveries, recent history and clear next actions.
- Connect booking to ownership; show delivery detail and event timeline.
- Add loading, empty, error and retry states, plus an account-linking explanation for existing users.

Operations:
- Initialize apps/operations-web with staff-only routing and independently scoped API access.
- Build delivery queue, filters, detail, driver availability and assignment/reassignment controls.
- Add hub intake and handover views; use Django admin for rare maintenance tasks initially.

Driver:
- Initialize apps/driver-mobile as Expo/React Native with separate Android/iOS identity.
- Build sign-in, assigned jobs, job detail, availability and permitted status/issue actions.
- Establish local persistence and mutation identifiers now, even before the full offline experience.
- Pilot foreground use first; do not promise background execution without device testing.

Acceptance: a customer books, a dispatcher assigns, a driver progresses an assigned task, and the customer sees the updated timeline. Run locally with controlled accounts first, then verify hosted auth once configuration is ready.

### 4. Private media and delivery proof

Work:
- Add private Supabase buckets for parcel/proof images and voice attachments, with distinct purpose/retention rules.
- Store media metadata and delivery association in Render PostgreSQL.
- Django checks ownership/assignment/scope before issuing short-lived upload or download access. Do not assume Supabase RLS can directly query Render's delivery tables.
- Validate byte size, actual file type and voice duration; compress photos and support interruption/retry.
- Track pending, uploaded, validated and attached states; clean up abandoned uploads.
- Implement proof capture/display in driver, customer and operations views with appropriate visibility.
- Replace profile/package Cloudinary usage, test the replacement, then remove Cloudinary dependencies and Render variables. Old assets need no preservation.

Acceptance: cross-delivery file access is denied; expired links fail; invalid uploads cannot become trusted proof; uploads recover from network interruption.

### 5. Ghana addressing and navigation

Work:
- Store GhanaPostGPS code, confirmed coordinates, landmark, entrance instructions, contact and coordinate source/accuracy.
- Let customers confirm or move their entrance pin instead of treating address lookup as unquestionable.
- Integrate Google Maps for appropriate map/routing features and navigation handoff.
- Validate the GhanaPostGPS wrapper's reliability, terms, maintenance and failure behavior before choosing it. Isolate it behind a server adapter; allow manual pin/landmark fallback.
- Preserve original digital addresses alongside corrections and distinguish estimated from customer-confirmed locations.
- Show navigation failure or stale data clearly. Cache only data permitted by provider terms; do not promise offline Google Maps tiles or guaranteed village road coverage.
- Field-test urban compounds, campus halls, rural approaches and misleading geocodes with Ghana-based testers.

Acceptance: a failed address lookup does not prevent booking or completing a delivery using a confirmed pin and instructions. Map-provider errors do not crash the workflow.

### 6. Two-way delivery conversations and notifications

Work:
- Add delivery-scoped threads with text and short voice recordings in both directions.
- Target 10–20 seconds for voice updates, with a 20-second maximum; allow shorter messages.
- Add recording preview/cancel, playback, text fallback, timestamps and queued/sent/failed states.
- Restrict conversation access to eligible customer participants, current assigned drivers and authorized support staff. Define recipient access separately from sender account ownership.
- Record support intervention; define retention and post-delivery access windows.
- Begin with paginated incremental polling. Add push notifications and background processing with retry/deduplication when implementing notifications.
- Never describe a queued offline message as delivered. Keep private message contents out of lock-screen notifications by default.

Acceptance: customer and driver exchange text/audio; unauthorized users cannot access a thread; duplicate sends do not duplicate messages; failed uploads can be retried.

### 7. Offline reliability and controlled location sharing

Work:
- Persist assigned jobs, necessary addresses and a device outbox; store sensitive tokens securely and limit cached personal data.
- Support pending/sending/synced/failed/conflict states, bounded backoff and visible manual retry.
- Persist local media before queueing; upload attachments before sending their message/proof reference.
- Recheck authorization on every replay. Assignment changes while offline must produce a recoverable conflict, not overwrite the dispatcher.
- Clear account-specific cached data on logout/account switch. Define expiry and recovery when an offline session can no longer authenticate.
- Gate location collection to an active shift/task with explicit device permissions; stop after duty/completion and label last-update time/accuracy.
- Adapt location frequency to battery/connectivity. Customer access must be scoped to their delivery and relevant leg, not a driver's whole route.
- Verify offline capability separately from navigation: cached instructions/status work does not guarantee offline routing.

Acceptance: airplane-mode status, text and voice survive process restart and synchronize once without duplication; revoked assignments fail safely; low-end Android and iPhone background behavior are tested on real devices.

### 8. Operations dashboard and customer experience completion

Operations:
- Views for unassigned, overdue, in-progress, completed and problematic deliveries.
- Driver workload, shift availability, last-seen location freshness and hub queues.
- Exception resolution, rescheduling, support history and audited corrections.
- Search and paginated exports with operational scope enforced.
- Reporting with explicit definitions: on-time rate, failed attempts, dwell time, deliveries per driver and unresolved issues.
- Restricted account/role management, staff MFA and administrative audit access.

Customer:
- Saved addresses and delivery instructions, history, issue reporting, proof/receipt access and notification preferences.
- Password reset, existing-account migration experience and account lifecycle handling.
- Clear pending/offline states, accessible forms and consistent Sender+ branding (#77C4E0 and #B22222).

Acceptance: staff can operate a shift without database edits; customers can understand and resolve routine delivery issues through the product.

### 9. Commercial workflow and launch hardening

Work:
- Confirm launch pricing, service areas, pickup windows, cancellation/refund rules and permitted goods.
- If online payment is required, select a Ghana-capable provider after current fee/settlement research; implement server-verified webhooks, idempotency and reconciliation. Until then label manual payment honestly.
- Decide high-school parcel inspection and institutional handover requirements before offering that service; avoid collecting unnecessary student details.
- Configure hosted auth/email, restricted API origins, production secrets and separate testing data.
- Add error monitoring, structured logs, request IDs, health checks and alert ownership.
- Exercise database backup restore, media retention/deletion, deployment rollback and credential recovery.
- Load-test the agreed pilot workload and a growth scenario; measure query counts, latency and media/notification costs.
- Complete end-to-end tests, keyboard/accessibility checks and Ghana field pilot, including failed delivery, return and support scenarios.

Acceptance: no known cross-account data access, no silent lost/duplicated status or message events, tested restoration procedure, named incident owner and successful pilot with real devices.

### 10. Mobile releases and expansion

- Driver: internal Android/iOS distribution, permission/privacy review, crash/battery checks, then store submissions. Store accounts, review and possible fees are external prerequisites.
- Customer: add apps/customer-mobile using shared contracts/utilities; implement native authentication redirects, booking, tracking, messages, proof and notifications. Reusing the API does not eliminate native screen work.
- Operations remains web-first unless a concrete staff mobile workflow justifies another client.
- Keep web and mobile API compatibility during staggered app updates; document support windows before removing endpoints.
- Expand service areas gradually using pilot evidence. Automated route optimization, forecasting and advanced fleet tools follow proven operational need.

## Scaling approach

- Keep a modular Django application, one authoritative business database and separate client releases initially.
- Index delivery owner/status/time, assignment driver/activity, events and thread cursors; paginate all growing lists.
- Keep file bytes in object storage; use controlled direct uploads instead of passing every large upload through the API process.
- Introduce a background worker/queue for actual notification, processing and cleanup work; make jobs retryable and idempotent. Do not provision infrastructure solely for hypothetical scale.
- Add database pooling, caching and additional API capacity based on measured connections, latency and contention.
- Keep telemetry retention bounded and distinct from the durable business event history.
- Supabase Auth/Storage do not automatically turn the separate Render database into a realtime feed. Choose polling, API-managed events or a reviewed integration explicitly.
- Document recurring costs before enabling paid map usage, notifications, workers, store distribution or paid tiers. No new paid service is authorized by this plan.

## Parallel setup track: Gideon

When Netlify access is restored: configure the already documented frontend variables, rebuild a test deployment and confirm the exact callback URL. Finish the Render auth switch only as part of the staged test. Current email testing can use the limited built-in Supabase sender; broader tester email delivery remains pending a suitable setup. Keep confirmation enabled.

Later: provide Google Maps configuration/budget, verify GhanaPostGPS integration route, select launch payment approach, and arrange Ghana-based driver testers. None blocks milestone 1.

## First implementation PR

Scope milestone 1 into a small reviewable foundation: owner relationship, assignment records, scoped list/detail APIs, assignment mutation permissions, minimal public tracking response, and tests. Add a service-area access model before granting non-admin staff broad access. Document compatibility for the existing tracking screen and unknown-owner packages. Do not include maps, storage migration, messaging or production auth activation in this PR.

Follow with lifecycle/event/idempotency work, then the first three-client demonstration. Progress is measured by acceptance gates rather than a fixed finish-date promise. Calendar estimates should follow the first two milestones and confirmed launch scope.
