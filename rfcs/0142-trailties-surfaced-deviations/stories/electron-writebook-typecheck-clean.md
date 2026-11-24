---
title: "electron-writebook example typechecks clean"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`examples/electron-writebook` runs and its tests pass, but `pnpm typecheck` there (`trails-tsc --schema db/schema.ts --noEmit`) reports ~180 errors, mostly in `.tse` views (untyped locals, async helper return types) and in concern host typing (`app/models/concerns/positionable.ts`, `app/controllers/concerns/authentication.ts`). Examples are not typechecked in CI (story `ci-examples-job`).

## Acceptance criteria

- `pnpm typecheck` in `examples/electron-writebook` exits 0 with no `any` casts added for the purpose.
