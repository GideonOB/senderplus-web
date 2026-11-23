# Booking accounts and delivery access

`Package.booked_by` records the Django account that submitted the booking. It
identifies the booking account and carries no legal ownership rights over the
parcel. Django sets it from the authenticated request, using the existing
Supabase or legacy authentication path. Request payloads cannot set or change
the booking account. Deleting an account clears the link and preserves the
delivery and its tracking code.

Guest submissions still work and have no booking account. Deliveries created
before the migration also remain unclaimed. My deliveries shows bookings
created while signed in to that account after rollout. Matching contact
information and tracking codes do not link existing deliveries to an account.
A tracking code identifies a delivery and gives access only to its public
tracking information.

## API contracts

Routes have no trailing slash. Keep using the configured authentication scheme:
`Authorization: Bearer <access token>` for Supabase or
`Authorization: Token <token>` for legacy Django token authentication.

| Request | Access | Successful response |
| --- | --- | --- |
| `POST /submit-package` | Guest or authenticated | Existing booking receipt and tracking code. Authenticated bookings are linked to the requesting account. |
| `GET /track/{tracking_id}` | Public | Exactly `tracking_id`, `status`, `status_display`, `created_at` and `updated_at`. This response is the same for signed-in callers. Unknown codes return 404. |
| `GET /deliveries?page=1` | Authenticated booking account | `count`, `next`, `previous` and `results`. Each page contains up to 20 deliveries, ordered by descending creation time and then descending primary key. Results contain `tracking_id`, `package_name`, `status`, `status_display`, `created_at` and `updated_at`. |
| `GET /deliveries/{tracking_id}` | Authenticated booking account | Private delivery detail with the tracking and status fields, booked parcel information, sender and recipient contact/address fields and the existing photo fields. |

Private detail includes the summary fields plus `package_type`, `weight`,
`value`, `description`, `photo`, `photo_url`, and `name`, `phone`, `email` and
`address` fields prefixed with `sender_` or `recipient_`. It omits account IDs.

The private endpoints return 401 without authentication and disable response
caching. Private detail returns 404 for unknown codes, another account's
deliveries and unclaimed deliveries. Driver or staff role alone grants no access
through the customer endpoints. Authorized operations staff can continue using
the existing status advancement and admin flows.

## Release order

1. Validate both legacy and staged Supabase builds locally with controlled
   accounts. Keep hosted authentication and email settings as configured.
2. Apply the additive Django migration before starting the new API code. There
   is no backfill. Existing API code can continue running with the new nullable
   column.
3. Coordinate the customer bundle and API release. Publish the updated customer
   bundle just before or alongside the API cutover. It reads the status fields
   common to both tracking responses. During any gap before the API cutover,
   My deliveries can show its retry state and bookings still use the old API's
   behavior. End-to-end booking-account validation starts after both releases.
4. After cutover, verify public tracking signed out and signed in, authenticated
   booking and receipt, list and detail isolation, guest booking and existing
   staff status updates. Test an old cached customer bundle against the reduced
   response. Older bundles may display blank or incomplete tracking sections
   and submit bookings without authentication. Verify that their public status
   still renders and ask affected users to reload the updated bundle. Keep the
   restricted response during frontend rollback or recovery.

In local Chromium, the previous production build rendered the tracking ID and
journey status from the reduced response without browser errors. Its old
contact and parcel sections showed blank labels and an empty weight value.
The previous build still required sign-in to open its tracking screen.

Hosted verification is pending Netlify access and the separate staged
authentication and email rollout described in [authentication.md](authentication.md).
The local test workflow uses SQLite, in-memory email and mocked Supabase
requests.
