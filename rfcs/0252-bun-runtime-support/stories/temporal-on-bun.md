---
title: "temporal-on-bun"
status: in-progress
updated: 2026-11-25
rfc: "0252-bun-runtime-support"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10766
claim: "2026-11-25T21:17:55Z"
assignee: "temporal-on-bun"
blocked-by: null
closed-reason: null
---

## Context

Bun 1.3.6 has no global `Temporal`. `packages/date/lib/date.ts:2828` reads it at
module evaluation, so anything that imports `@blazetrails/date` (activesupport,
activerecord, every app) throws `ReferenceError: Temporal is not defined` at load
under Bun. Found running
`bun --bun node_modules/vitest/vitest.mjs run --project activerecord packages/activerecord/test/cases/base.test.ts`
(2026-11-25). This blocks `bun-sqlite-driver`'s "every sqlite test passes on
bun-sqlite" criterion and every Bun boot in RFC 0252. The `bun:sqlite` engine
itself (`packages/sqlite3/lib/engine/bun-sqlite.ts`) passes its engine tests under Bun.

Options for the operator: a Temporal polyfill loaded by the Bun process adapter
(a new runtime dependency, which needs a ruling), or wait for Bun to ship Temporal.

## Acceptance criteria

- [ ] `bun -e 'await import("@blazetrails/activerecord")'` loads without a ReferenceError.
- [ ] The activerecord sqlite suite starts under `bun --bun node_modules/vitest/vitest.mjs`.
