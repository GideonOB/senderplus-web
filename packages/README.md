# Shared client packages

This directory is reserved for code used by multiple applications. It currently
contains no npm packages; add a private `package.json` to each actual package as
it is implemented. Root npm workspaces discover packages under `packages/*`.

Likely first packages are `api-client` for Django API requests and `contracts`
for shared API schemas/types. Extract code when its interfaces are clear and a
second client needs it. Keep authentication persistence injectable so browser and
mobile storage can differ. Shared packages must not depend on an app's source,
Vite environment variables, browser globals, or native device APIs.

Django owns roles, validation, delivery transitions, and persistence. Shared
client definitions describe that API; they do not replace server-side enforcement.
Web UI components and React Native UI components are separate concerns, so there
is no forced cross-platform UI package in this first stage.
