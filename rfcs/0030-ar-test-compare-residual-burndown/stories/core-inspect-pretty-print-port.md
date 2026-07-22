---
title: "core-inspect-pretty-print-port"
status: ready
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare` (2026-07-22) reports 9 missing tests in `core.test.ts` — Rails'
inspect/pretty-print family from
vendor/rails/activerecord/test/cases/core_test.rb:

- inspect instance with lambda date formatter (:33)
- inspect singleton instance (:50)
- pretty print new (:109), persisted (:139), full (:168), uninitialized (:199),
  overridden by inspect (:208), with non primary key id attribute (:219),
  with overridden attribute for inspect (:226)

trails file: `packages/activerecord/src/core.test.ts` (tests absent). The
pretty_print family exercises Rails' `pretty_print` (PP) integration on
ActiveRecord::Core — decide the faithful TS analogue (inspect-based output)
before porting; if a subset is Ruby-PP-only, record permanent-skip reasons per
the RFC Deferred table rather than inventing behavior.

## Acceptance criteria

- [ ] Each listed test ported (name verbatim) and matched in `test:compare`, or
      reclassified permanent-skip with a recorded reason.
- [ ] `core.test.ts` missing count drops to 0; no new gate-mismatches.
