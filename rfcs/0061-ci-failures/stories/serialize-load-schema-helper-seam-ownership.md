---
title: "serialize-load-schema-helper-seam-ownership"
status: done
updated: 2026-07-31
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5696
claim: "2026-07-31T01:06:04Z"
assignee: "serialize-load-schema-helper-seam-ownership"
blocked-by: null
closed-reason: null
---

## Context

Four PRs reshaped the `loadSchema` / `loadCanonicalSchema` /
`loadAdapterSpecificSchema` seam in
`packages/activerecord/src/support/load-schema-helper.ts` in a single evening,
with no serialization between them:

- #5673 added the trails-only `uuid_default` cover
  (`support/load-schema-helper-uuid-default.trails.test.ts`).
- #5676 routed that cover through `loadSchema`, relying on the thunk overload
  `loadSchema(adapterOrCanonicalArm: DatabaseAdapter | (() => Promise<DatabaseAdapter>))`,
  whose function form deliberately skipped `loadCanonicalSchema`.
- #5677 re-exported `loadAdapterSpecificSchema` after #5670/#5671 dropped the
  export in a way that only broke in the merge.
- #5678 removed the thunk overload, landing `loadSchema(adapter: DatabaseAdapter)`
  (now `load-schema-helper.ts:529`). Correct on its own — Rails
  (`vendor/rails/activerecord/test/support/load_schema_helper.rb:4-21`) has one
  mechanism and needs no seam — but it silently changed the cover's semantics.
- #5686 fixed the fallout by calling `loadAdapterSpecificSchema` directly.

Three of those five were merge-only breakages: each PR was green on its own
base, and the failure existed only in the merged result. Two were type errors
caught by `pnpm build`; one (#5676 + #5678) type-checked fine after the naive
fix and failed only on the PG lane, because the thunk was carrying semantics
rather than just a type. That failure is invisible locally: the cover is
`describeIfPg`, so it skips unless `ARCONN=postgresql` is set.

Story `main-broken-load-schema-thunk-vs-adapter-signature` (PR #5684) was
opened to fix the second instance and was superseded by #5686 mid-flight.

## Acceptance criteria

- The seam has a single owner: `loadSchema`, `loadCanonicalSchema`,
  `loadAdapterSpecificSchema`, `canonical-schema-stamp.ts`, and the per-worker
  boot in `test-setup-dy.ts` are reshaped by one story at a time, not by
  concurrent siblings.
- The arm-vs-full-load distinction is enforced rather than commented: a caller
  that stubs `createTable` and reaches for `loadSchema` should fail fast (lint
  rule, type-level distinction, or a runtime guard) instead of surfacing as
  `relation "..." does not exist` on the PG lane only.
- Determine whether `loadAdapterSpecificSchema` should stay exported at all, or
  whether its two legitimate consumers (the trails-only arm covers and the
  per-worker boot fast path, `load-schema-helper.ts:538-540`) want a narrower
  seam.
- Covers gated behind `describeIfPg` that guard merge-sensitive behaviour are
  reachable in the lane a contributor actually runs before pushing, or the
  gating is documented at the call site.
