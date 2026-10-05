---
title: "activerecord: build_explain_clause joins Symbol options through Array#join instead of a hand-written colon strip"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
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

Surfaced reviewing trails#8486. Rails' `build_explain_clause` joins the option list directly:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:145-149`
  — `"EXPLAIN (#{options.join(", ").upcase})"`
- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/database_statements.rb`
  — `build_explain_clause`, same `options.join(" ").upcase` shape.

The options are Symbols (`:analyze`, `:verbose`), and `Array#join` sends `to_s`, which drops the colon. In
trails a Symbol is the string `":analyze"`, so both ports add a `.map(...)` that strips the leading colon
before `.join`:

- `packages/activerecord/src/connection-adapters/postgresql/database-statements.ts#buildExplainClause`
  (`.map((option) => option.replace(/^:/, ""))`, receipted `@inventedArm map`)
- `packages/activerecord/src/connection-adapters/mysql/database-statements.ts#buildExplainClause`
  (`.map((option) => (option.startsWith(":") ? option.slice(1) : option))`)

ruby-compat exports no `Array#join` that applies Ruby's `to_s` to each element (and recurses into nested
arrays, as `rb_ary_join` does), so each call site hand-strips.

## Acceptance criteria

- [ ] ruby-compat has `Array#join` (`rb_ary_join`, with its MRI citation and receipt) that renders a
      `":name"` Symbol string as `name` and recurses into nested arrays.
- [ ] Both `buildExplainClause` bodies are `options.join(...).upcase` through it, with no `map`.
- [ ] The `@inventedArm map` receipt on the PostgreSQL body is deleted.
