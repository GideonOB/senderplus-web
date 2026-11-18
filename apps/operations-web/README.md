# Operations web app — planned

Reserved for a separate staff and management web dashboard. No working dashboard
or npm package is implemented yet. Use package name `@senderplus/operations-web`
when the application is created, with an independent build and hosting site.

Planned responsibilities include dispatch, driver assignments, delivery progress,
exception handling, support, and operational reporting. The dashboard uses the
shared Django API, where staff roles, access boundaries, and audit history are
enforced. UI visibility alone must never grant access.

Keep dashboard routes and dependencies separate from the customer app. Reuse
client contracts or platform-independent utilities through `packages/` once they
exist; do not import another application's internal source files.
