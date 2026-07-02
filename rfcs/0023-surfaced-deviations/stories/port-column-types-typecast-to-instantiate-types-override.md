---
title: "Port base.test 'column types typecast' to Rails instantiate-with-types shape"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/base.test.ts` "column types typecast" was converged
in PR #4394 onto `Developer.salary` and now tests integer create-time casting
(`Developer.create({ salary: "5" })` → `5`). Rails `base_test.rb`
`test_column_types_typecast` (vendor/rails/activerecord/test/cases/base*test.rb:1661)
tests a \_different* mechanism: it calls `Topic.instantiate(attrs, types)` with a
custom `ActiveRecord::Type::Value` subclass overriding `cast` for the
`author_name` key, and asserts the override is applied
(`assert_equal "t.lo", topic.author_name`).

The trails test name matches Rails but the body exercises a different code path
(column-declared cast vs. per-instantiate types override). This is a fidelity
gap surfaced during the canonical-schema convergence.

## Acceptance criteria

- [ ] Port "column types typecast" in `base.test.ts` to Rails' shape: build a
      `Topic` from canonical `topics`, create/instantiate with a custom Value
      type keyed on a real column (e.g. `author_name`), and assert the override
      cast is applied via `Base.instantiate(attrs, types)`.
- [ ] Verify trails exposes an `instantiate(attributes, types)` entry point with
      a per-attribute types map; if not, note the gap (do not fake it).
- [ ] Test name stays verbatim; no bespoke schema.
