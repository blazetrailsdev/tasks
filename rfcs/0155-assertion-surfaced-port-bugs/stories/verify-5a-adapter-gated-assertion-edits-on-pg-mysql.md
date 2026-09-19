---
title: "verify-5a-adapter-gated-assertion-edits-on-pg-mysql"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

trails#7886 edited adapter-gated tests that skip on SQLite and were never run by the author: `comment.test.ts` ("schema dump with comments" index assertions, "schema dump omits blank comments" unrolled), `migration/check-constraint.test.ts` ("check constraints scoped to schemas" via `assertNoChanges`), `defaults.test.ts` (PG "schema dump includes default expression" else-arm). Rails: `comment_test.rb:126-162`, `check_constraint_test.rb:87-99`, `defaults_test.rb:150-165`.

## Acceptance criteria

- Run those files against PostgreSQL and MySQL; fix any regex/order mismatches with the schema dumper's `t.index(...)` output.
- Any real dumper divergence found is filed or fixed with a Rails `file:line`.
