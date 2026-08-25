---
title: "call-args-ar-mysql-case-sensitive-comparison"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6450
claim: "2026-08-13T01:36:46Z"
assignee: "call-args-ar-mysql-case-sensitive-comparison"
blocked-by: null
closed-reason: null
---

## Context

Noted while landing `naming-burndown-activerecord-rest` (RFC 0096) and carried
forward by `naming-burndown-activerecord-rest-2`: an argument-SHAPE defect that
the naming burndown deliberately does not rename away.

`AbstractMysqlAdapter#case_sensitive_comparison`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`)
passes `value` to the comparison it builds; the port at
`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`
passes `attribute.quotedNode(value)` instead — an invented call-site
conversion, not a different spelling of the same argument.

## Acceptance criteria

1. `caseSensitiveComparison` passes what the Rails body passes, verified
   against the vendored `abstract_mysql_adapter.rb` line.
2. If the `quotedNode` wrap is load-bearing, the reason is that the port's
   Arel node differs from Rails' — say which, and converge the node rather than
   the call site.
3. Its `kind: "args"` baseline row (if present) is deleted by hand
   (only-shrink); `pnpm parity:api:calls:args` green.
4. MySQL/MariaDB lanes green.
