# Driver mobile app — planned

Reserved for a separate Expo/React Native application for Android and iOS.
There is no app manifest, dependency installation, or runnable driver UI yet.
Initialize the Expo project here when driver implementation begins, with package
name `@senderplus/driver-mobile` and its own app identifiers and release settings.

Planned responsibilities:

- Driver access, availability, assigned deliveries, and status updates.
- Navigation using Google Maps and GhanaPostGPS address information, supplemented
  by customer-confirmed pins, landmarks, and delivery instructions.
- Delivery issue reporting, proof photos, and customer communication by text and
  approximately 10–20-second voice messages in both directions.
- Persisted assigned-job data and an offline outbox for status changes and media.
  Display queued/sending/failed states; replay with idempotency and server-side
  permission checks when connectivity returns.

Use the shared Django API. Device storage, GPS, recording, notification handling,
and background behavior belong to this app. Do not import browser components,
`localStorage`, or Vite environment code from `customer-web`.
