---
title: "trailmap: lint floating promises so an unawaited async framework call fails CI"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#176
claim: "2026-11-19T12:16:24Z"
assignee: "db-seed-never-exits"
blocked-by: null
closed-reason: null
---

## Context

trailmap has no ESLint config, so nothing flags a promise that nobody awaits. trailmap#170 found four controller actions calling the async `redirectTo` without `await`:

- `app/controllers/sessions-controller.ts:255`
- `app/controllers/story-pages-controller.ts:302`
- `app/controllers/rfc-pages-controller.ts:252`
- `app/controllers/repo-settings-controller.ts:104`

trails' `redirectTo` (`packages/actionpack/lib/action-controller/metal/redirecting.ts:81-106`) sets the response body only after `await this.setResponseBody("")`. Unawaited, the implicit render runs first, and `sessions#pane` rendered its template with no locals ("name is not defined"). The bug surfaced only when the trails pin moved. trails itself runs `@typescript-eslint/no-floating-promises` with `ignoreVoid: false` (trails CLAUDE.md, "Every promise has an owner"); trailmap does not.

## Acceptance criteria

- [ ] trailmap gets a flat `eslint.config.mjs` with typed linting over `app/`, `lib/` and `config/`, enabling `@typescript-eslint/no-floating-promises` (`ignoreVoid: false`) and `@typescript-eslint/no-misused-promises`.
- [ ] A `pnpm lint` script, run as a CI job.
- [ ] Every existing report is fixed in code, with no `eslint-disable`.
