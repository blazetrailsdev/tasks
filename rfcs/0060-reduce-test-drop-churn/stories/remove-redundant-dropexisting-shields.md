---
title: "Remove redundant per-file dropExisting rebuild shields"
status: ready
updated: 2026-07-04
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: ["truncate-based-global-reset"]
deps-rfc: []
est-loc: 120
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-on to `truncate-based-global-reset`. Once the global reset truncates
instead of drops on a boot-stable schema, per-file `dropExisting` rebuild
shields are redundant: they exist only to force a known table shape at file
start, which the boot-laid canonical schema (RFC 0059) already guarantees.

`git grep -ln dropExisting -- 'packages/activerecord/src/**/*.test.ts'` = 1 file,
5 occurrences today (the residual after RFC 0059's
`convert-core-persistence-dropexisting-shields` story). These `dropExisting`
calls each issue a `DROP TABLE` + `CREATE TABLE` at `beforeAll`/`beforeEach`.
Compare to the shipped pattern in RFC 0059's dropExisting-shield conversions.

## Acceptance criteria

- The remaining `dropExisting` shield(s) removed; the file rides the ambient
  boot-laid canonical tables + truncation reset. No test renames.
- `git grep -c dropExisting -- 'packages/activerecord/src/**/*.test.ts'` = 0
  (or, if a shield genuinely guards a bespoke divergent shape, it is documented
  as out-of-scope pending RFC 0019 burndown rather than removed).
- Read the corresponding Rails test first; `test:compare` delta ≥ 0; file green
  on all 3 adapters (this file is in the shared-DB flake set — verify no
  collision regression).
