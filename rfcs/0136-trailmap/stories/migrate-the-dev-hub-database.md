---
title: "The dev hub database is a migration behind (no rfc_refines), so booting against it fails"
status: draft
updated: 2026-11-17
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found 2026-11-17 while shooting trailmap#155's screenshots. Booting against
the dev hub (`dokku postgres:info trailmap-hub-dev`, database
`trailmap_hub_dev`) fails in `config/initializers/hub-database.ts`:
"HUB_DATABASE_URL names a database without the hub schema (no rfc_refines)".
The `rfc_refines` table arrived with #151's `db/hub-migrate` migration, and the
dev hub was never migrated past it. Deploys migrate the production hub
through the Procfile release task; nothing migrates the dev one.

## Acceptance criteria

- `trailmap_hub_dev` is migrated to the current `db/hub-migrate` head.
- Whatever serves or boots against the dev hub migrates it on deploy as
  production does, or docs/deploy.md names the command and when to run it.
