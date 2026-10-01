---
title: "require-canonical-rebuild: burn or count the four remaining inline disables"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8325 deleted `eslint/require-canonical-rebuild-exclude.json`, the file-level
exemption list for `blazetrails/require-canonical-rebuild`. Four line-level
`eslint-disable-next-line blazetrails/require-canonical-rebuild` directives remain, and
nothing counts them:

- `packages/activerecord/src/migration/exclusion-constraint.test.ts:33` and
  `packages/activerecord/src/migration/unique-constraint.test.ts:35` — the teardown
  `drop_table "invoices"` / `"sections"` from
  `vendor/rails/v8.0.2/activerecord/test/cases/migration/exclusion_constraint_test.rb:23-25`
  and `unique_constraint_test.rb:22-24`, on the shared connection. Safe only because both
  files are PostgreSQL-only and ride transactional `fixtures([])`, so the DDL rolls back
  (measured on #8325: both tables read back canonical after the file).
- `packages/activerecord/src/adapters/postgresql/schema.test.ts:1131` — `dropTable("articles")`
  in a `finally`, no reason on the directive.
- `packages/activerecord/src/adapters/abstract-mysql-adapter/active-schema.test.ts:204` —
  `dropTable("people")` under `captureSql(..., { stub: adapter })`, which never executes.

The rule (`eslint/require-canonical-rebuild.mjs`) cannot see either safe case: a drop
whose SQL is captured rather than run, and a drop inside a transaction on an adapter with
transactional DDL.

## Acceptance criteria

- [ ] The rule recognises a drop made inside a `captureSql(..., { stub })` callback as non-executing, with a rule test, and the `active-schema.test.ts` directive is deleted.
- [ ] `schema.test.ts:1131` either stops dropping the canonical `articles` table or its directive carries the Rails `file:line` and the reason it is safe.
- [ ] A guard test counts the remaining `require-canonical-rebuild` directives under `packages/activerecord/src` and fails on any increase, so the two constraint-test directives cannot be joined by a third unnoticed.
