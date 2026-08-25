---
title: "Pin the boot fast path's re-stamp by making boot state observable to a test"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5718
claim: "2026-07-31T16:15:05Z"
assignee: "pin-boot-fast-path-restamp-with-observable-boot-state"
blocked-by: null
closed-reason: null
---

## Context

PR #5706 put all three lanes on `test-setup-dy.ts`'s TRUNCATE boot fast path by
stamping the sqlite template file and each MySQL slot DB in
`buildTemplateSchema` (`packages/activerecord/src/support/template-global-setup.ts:62-78`),
and by **re-stamping** at the end of the fast-path arm
(`packages/activerecord/src/test-setup-dy.ts:65-72`) — `resetTestTables` drops
`ar_internal_metadata` along with the other bookkeeping tables
(`packages/activerecord/src/support/drop-all-tables.ts:9-12`), so without it the
stamp was single-use per database and every recycled worker paid the full
purge+reload. The re-stamp is where most of the measured win came from (MySQL
setup 167.8s → 148.4s; sqlite setup 198.2s → 180.0s).

That re-stamp is **not pinned by any test**. The probe added in
`packages/activerecord/src/support/template-stamp.test.ts` ("boot fast path
stamp") replays the arm's _composition_ against the worker's own database, but
cannot observe the production call site: boot runs once per worker, and later
files' between-test resets clear the stamp again, so a test file has no
deterministic view of post-boot state. Deleting the `stampCanonicalSchema` call
in `test-setup-dy.ts` would silently cost the speedup without turning anything
red — the wall-clock numbers in the PR are currently the only guard.

## Acceptance criteria

- The boot records what it actually did (which arm it took, and whether it left
  the database stamped) somewhere a test file can read deterministically.
- A test asserts that a boot which took the fast path leaves the database
  reporting `canonicalSchemaUpToDate`, on all three lanes.
- That test fails if the `stampCanonicalSchema` call at the end of
  `test-setup-dy.ts`'s fast-path arm is removed.
- No new module-level surface beyond what the assertion needs; no `node:*`
  imports; async fs only.
