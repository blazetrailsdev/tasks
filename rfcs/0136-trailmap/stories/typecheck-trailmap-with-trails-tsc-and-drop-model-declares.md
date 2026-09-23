---
title: "Typecheck trailmap with trails-tsc and delete the hand-written model declares"
status: draft
updated: 2026-09-23
rfc: "0136-trailmap"
cluster: null
packages: ["trails-tsc"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From the trailmap Rails-idiom audit. trailmap's models carry roughly 60
hand-written `declare` lines: every column (`app/models/story.ts:52-69`,
`rfc.ts:33-46`, `event.ts:12-19`, `joins.ts`, `meta.ts:8-9`), every
association proxy (`story.ts:71-78`, `rfc.ts:47`), the enum-generated surface
(`story.ts:85-89`, `rfc.ts:49-51`) and an internal loader
(`story.ts:79`, `declare loadBelongsTo`). A Rails model has none of them.

trails removes them with `trails-tsc --schema db/schema.ts`, the zero-declare
path the trails README documents ("so you never hand-write a `declare`").
trailmap already has `@blazetrails/trails-tsc` as a devDependency and uses its
views plugin in `tsconfig.json:13-18`, but `pnpm build` is plain `tsc`
(`package.json`, `"build": "tsc"`). `set-up-ci-for-trailmap` meant to make this
switch ("trailmap is the app that should prove zero-declare models, so
`trails-tsc --schema db/schema.ts` running against the real models is itself a
framework signal"). It shipped with `tsc`, and the generator emits `tsc` too
(filed as `generated-app-typechecks-with-tsc-not-trails-tsc`, RFC 0142).

## Acceptance criteria

- `pnpm build` (and CI's typecheck) runs `trails-tsc --schema db/schema.ts`.
- Every `declare` in `app/models/` is deleted, except where `trails-tsc` can't
  synthesize the member. Each such leftover gets a framework story filed
  against the package that owns the synthesis (RFC 0035 or the owning
  package's bucket), and a comment at the `declare` names that story.
- `declare loadBelongsTo` goes. Its one caller
  (`test/models/tasks-database.test.ts:137`) reads the association the way the
  trails README does.
- `pnpm build`, `pnpm test` and `pnpm gate` pass.
