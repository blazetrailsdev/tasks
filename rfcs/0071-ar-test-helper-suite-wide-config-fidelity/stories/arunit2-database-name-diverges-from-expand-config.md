---
title: "arunit2 database name diverges from expand_config's activerecord_unittest2"
status: draft
updated: 2026-07-27
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5448 (credential convergence). Rails' second test database is
`activerecord_unittest2` — `ARTest.expand_config` maps `arunit` →
`activerecord_unittest` and `arunit2` → `activerecord_unittest2`
(`vendor/rails/activerecord/test/support/config.rb:28-31`), i.e. the primary
name plus a literal `"2"`.

trails instead suffixes `_arunit` / `_arunit2`
(`packages/activerecord/src/support/arunit2-config.ts:29-49`). #5448 converged
the primary name to `activerecord_unittest` but left the pair suffixes, and
documented why at the call site: the primary name already carries the per-worker
`AR_DB_SLOT` suffix, so Rails' `+"2"` rule turns slot 3's
`activerecord_unittest_3` into `activerecord_unittest_32` — which is slot 32's
own database.

## Acceptance criteria

Decide and record one of:

- a slot-safe spelling that still yields Rails' literal
  `activerecord_unittest2` at slot 1 (e.g. apply the slot suffix after the
  arunit2 name rather than before), so the un-sharded/local case matches Rails
  exactly; or
- keep `_arunit2` permanently, with the collision note as the record.

Either way the outcome is written down rather than re-derived.
