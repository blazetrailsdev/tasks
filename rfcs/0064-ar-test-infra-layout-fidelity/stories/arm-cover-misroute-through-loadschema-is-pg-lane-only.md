---
title: "arm-cover misroute through loadSchema is invisible to the unit lane"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5693
claim: "2026-07-31T00:39:09Z"
assignee: "arm-cover-misroute-through-loadschema-is-pg-lane-only"
blocked-by: null
closed-reason: null
---

## Context

PR #5676 rewrote `packages/activerecord/src/support/load-schema-helper-uuid-default.trails.test.ts`
to call `loadSchema` instead of `loadAdapterSpecificSchema`, applying the
"schema loads always go through `loadSchema`" rule to a test that is not a
schema load. That cover stubs `createTable` to capture emitted DDL _without_
laying anything on the shared per-worker database, so `loadSchema`'s canonical
half (`support/load-schema-helper.ts:529-532`) queries tables that were never
created and dies with `StatementInvalid: relation "1_need_quoting…" does not
exist`. #5687 reverted it to the arm-direct call.

Two things made this expensive to catch. The break is **PG-lane-only** — the
unit lane skips the file via `describeIfPg`, so a full local unit run is green
and only a ~500s CI shard reports it. And #5676 shipped a second, _louder_
failure in the same commit (a `tsc --build` type error, which husky's repo-wide
pre-commit hook turns into a block on every commit in every worktree), so the
obvious repair — make the argument typecheck — leaves the real defect in place.
`loadAdapterSpecificSchema`'s docstring (`load-schema-helper.ts:544`) already
carves out these covers, but nothing mechanically enforces it.

## Acceptance criteria

- Arm-content covers that stub a DDL emitter cannot be silently rerouted through
  `loadSchema`: either a lint rule over `*.trails.test.ts` files that intercept
  `createTable`, or a cheap unit-lane assertion that fails without a live PG.
- The guard fails on the #5676 shape (`loadSchema` + stubbed `createTable`) and
  passes on the current arm-direct shape — verified by synthetic regression,
  not by inspection.
- Whatever form it takes must fail in the unit lane, not only under `ARCONN=postgresql`.
