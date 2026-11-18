---
title: "internal mark counts Rails-backed private ports as debt"
status: draft
updated: 2026-11-18
rfc: "0061-ci-failures"
cluster: null
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `internal` mark (`scripts/api-compare/extra-surface-internal-mark.json`,
RFC 0120) is only-shrink with no reseed, but `countTsInternalNames`
(`scripts/api-compare/extra-surface.ts:1230`) counts every `internal: true`
member, including ones whose Rails counterpart is itself private/protected.
Those are faithful ports: `blazetrails/rails-private-jsdoc` _requires_ their
`@internal` tag. The mark's own JSDoc (`scripts/api-compare/extra-surface-mark.ts:122-127`)
concedes "most `@internal` uses are correct". So any PR porting a Rails-protected
method reds, and the only exit is raising a mark, which CLAUDE.md forbids.

Live instance: trails#10278 (i18n Cascade/Memoize/Middleware) reds with
`i18n internal: mark 94 → current 98`. The four are `Memoize#lookup`,
`#memoizedLookup`, `#resetMemoizationsBang` (all under `protected` in
`vendor/i18n/v1.14.8/lib/i18n/backend/memoize.rb:36-51`) and
`Middleware`'s `private app` (Rails' `@app` ivar,
`vendor/i18n/v1.14.8/lib/i18n/middleware.rb`).

The Rails-backed set already exists: `eslint/rails-private-methods.json`
(built by `pnpm rails-privates:manifest`), the same manifest
`unbacked-internal-needs-receipt` (RFC 0121) uses to find unbacked internals.

## Acceptance criteria

- `countTsInternalNames` excludes a member whose (file, name) is Rails-private
  per the rails-privates manifest, so the `internal` mark measures only
  unbacked internals (debt), consistent with RFC 0121's population.
- Decide and document how a TS `private` field porting a Ruby ivar
  (e.g. `Middleware#app`) is counted; state the rule in the
  `INTERNAL_MARK_PATH` JSDoc.
- Marks are narrowed with the gate's tighten command only (they will drop);
  no mark is raised.
- Unit tests in `scripts/api-compare/extra-surface*.test.ts` cover a
  Rails-backed `@internal` (not counted) and an unbacked one (counted).
- trails#10278's i18n count no longer exceeds its mark from the three
  Memoize members.
