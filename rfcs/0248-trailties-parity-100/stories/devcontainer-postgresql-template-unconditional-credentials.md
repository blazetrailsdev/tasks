---
title: "devcontainer postgresql.yml template writes Rails' unconditional postgres credentials"
status: draft
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
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

The devcontainer arm of `packages/trailties/lib/generators/trails/app/templates/config/databases/postgresql.yml.tt`
writes `username: process.env.DB_HOST ? "postgres" : undefined` and the same
conditional for `password`. Rails' devcontainer arm
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/databases/postgresql.yml.tt`)
writes `host: <%%= ENV["DB_HOST"] %>`, `username: postgres` and `password: postgres`
unconditionally. `devcontainer-generator.test.ts` "database postgresql" asserts
`username: .*"postgres"` to tolerate the conditional.

## Acceptance criteria

- [ ] The devcontainer arm writes `host` from `DB_HOST` and the `postgres` username and password with no conditional, as Rails does.
- [ ] The test asserts `username: "postgres"` and `password: "postgres"` exactly.
