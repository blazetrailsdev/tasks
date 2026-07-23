---
title: "port-prepared-statement-status-test"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
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

`test:compare --incomplete` marks `prepared_statement_status_test.rb` ✗ — no TS
file exists. Rails source:
`vendor/rails/activerecord/test/cases/prepared_statement_status_test.rb:9` —
one test, "prepared statement status is thread and instance specific": two
distinct connections (Course vs Entrant, different pools), each enters
`unprepared_statement { }` and asserts the OTHER connection's
`prepared_statements` flag is unaffected. The threaded interleave
(Concurrent::Event) maps to trails' async interleaving pattern (cf.
transactions.trails.test.ts concurrency tests); the `else` branch (adapter with
prepared_statements off) is trivially portable. Note: a stub
`prepared-statement-status.test.ts` once existed and was referenced by 0016
h3-reclassify-permanent-skips (done, PR 3006) but the file is gone today — if
the interleave proves unportable, the deliverable is restoring an explicit
permanent-skip classification instead of a silent ✗.

## Acceptance criteria

- `packages/activerecord/src/prepared-statement-status.test.ts` exists with the
  Rails test name, asserting per-connection `unprepared_statement` isolation
  across two pools (async interleave in place of Ruby threads), OR the file is
  explicitly classified permanent-skip with justification at the call site.
- `test:compare --package activerecord` no longer shows the file as ✗.
