---
title: "activerecord: PostgreSQL ExplainPrettyPrinter#pp centers through String#center"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
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

Surfaced by trails#8390 (the `ca-drivers` receipt audit), which converged `pp`'s two `first` calls.

`PostgreSQL::ExplainPrettyPrinter#pp`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/explain_pretty_printer.rb:20-40`):

```ruby
lines  = result.rows.map(&:first)
…
pp << header.center(width).rstrip
```

`packages/activerecord/src/connection-adapters/postgresql/explain-pretty-printer.ts` writes
`result.rows.map((row) => String(first(row)))` — a `to_s` Rails does not make (`:22`) — and hand-rolls
the centring as `" ".repeat(Math.floor((width - header.length) / 2)) + header` where Rails calls
`String#center` then `rstrip` (`:30`). ruby-compat has no `center`
(`vendor/ruby/v3.3.11/string.c` `rb_str_center`).

## Acceptance criteria

- [ ] `lines` is `result.rows.map(first)` with no `String(...)`, or the story records which EXPLAIN
      format hands `pp` a non-string cell and why Rails does not see it.
- [ ] The header line is `center` then `rstrip` through ruby-compat / activesupport exports, not
      arithmetic.
- [ ] The PostgreSQL explain tests pass on the PostgreSQL lane.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/adapters/postgresql/explain.test.ts
```
