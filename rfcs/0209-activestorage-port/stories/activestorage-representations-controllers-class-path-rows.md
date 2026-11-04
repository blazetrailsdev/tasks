---
title: "Seat Representations controllers in the activestorage constant table"
status: done
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9684
claim: "2026-11-03T22:28:13Z"
assignee: "activestorage-engine-models-seated-by-app-loader"
blocked-by: null
closed-reason: null
---

## Context

trails#9676 ported `ActiveStorage::Representations::{BaseController,RedirectController,ProxyController}`
at `packages/activestorage/src/representations/*.ts`
(`vendor/rails/v8.0.2/activestorage/app/controllers/active_storage/representations/*.rb`).
`pnpm parity:class-paths` (`scripts/api-compare/class-paths.ts`, `walkConstants` in
`scripts/api-compare/constant-table.ts:183`) did not add rows for them to
`packages/activestorage/src/constants.generated.ts`, while the sibling
`blobs/{proxy,redirect}-controller.ts` have rows (`constants.generated.ts:101-102`).
`--check --package activestorage` stays green. The routes in `config/routes.ts:27-36`
name `active_storage/representations/{redirect,proxy}#show`, so resolving those
controllers by name in a booted app (no explicit import, as the tests do) may miss.

## Acceptance criteria

- Find why the walk skips `src/representations/` and fix the walk (not by hand-editing the table).
- `constants.generated.ts` carries `ActiveStorage::Representations::{BaseController,RedirectController,ProxyController}`.
- A route dispatch to `active_storage/representations/redirect#show` resolves without the test importing the controller module.
