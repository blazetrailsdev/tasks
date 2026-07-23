---
title: "query-logs-escape-comment-fidelity"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

3 assertion-VALUE mismatches in `query-logs.test.ts` vs
`vendor/rails/activerecord/test/cases/query_logs_test.rb:43-57`. trails
weakened all three escape tests:

- "escaping good comment": Rails asserts `app:foo` through
  `escape_sql_comment`; trails asserts `app:MyApp` (trails/query-logs.test.ts:69).
- "escaping good comment with custom separator": Rails sets
  `tags_formatter = :sqlcommenter` and asserts `app='foo'` (quoted); trails
  asserts unquoted `app=MyApp` and never exercises the sqlcommenter formatter.
- "escaping bad comments": Rails asserts three adversarial payloads
  (`*/; DROP TABLE USERS;/*` → `* /; DROP TABLE USERS;/ *`, etc. — including
  the `**//` and `* *//...//* *` nesting cases); trails
  (query-logs.test.ts:77-81) only covers `*/`, `/*`, `/* evil */`.

The bad-comments gap is the substantive one: the nested/`**//` cases verify
the escaping is iteration-safe. Port Rails' exact inputs/outputs.

## Acceptance criteria

- All three tests use Rails' inputs and expected outputs (incl. sqlcommenter
  formatter setup).
- `--assertions` shows 0 value-mismatches for query_logs_test.rb.
