---
title: "ported-tests-order-arg-symbol-vs-string"
status: draft
updated: 2026-11-14
rfc: "0189-activerecord-surfaced-deviations"
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

`audit-model-and-test-order-arg-symbol-vs-string` swept the canonical models in
`packages/activerecord/test/models/` against `vendor/rails/v8.0.2/activerecord/test/models/`
and converted the scopes where Rails passes a Symbol (`reply.rb:11`, `author.rb:11,220,224`,
`post.rb:282`, `company.rb:119`). The ported test files were not swept.

A string order arg stays bare and a Symbol/Hash arg qualifies to the table, so the arg type
decides `ORDER BY id` vs `ORDER BY "posts"."id"`. #4952 converted the ported tests that broke CI
(`finder`, `relations`, `calculations`, `cascaded-eager-loading`, `reserved-word`, `order`).

## Acceptance criteria

- [ ] Every `.order("<bare column>")` / `.reorder(...)` in `packages/activerecord/test/cases/**/*.test.ts`
      matches the arg type of its Rails test (`vendor/rails/v8.0.2/activerecord/test/cases/`):
      `":col"` where Rails uses `:col`, a string where Rails uses a string.
- [ ] No test renamed; green on sqlite, PG and MariaDB.
