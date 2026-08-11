---
title: "Comparator: ignore the nil padding TS needs to reach a block-as-trailing-parameter (11 rows)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6351
claim: "2026-08-11T11:44:09Z"
assignee: "call-args-tool-ignore-block-tail-nil-padding"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass (PR #6348). 11 `activerecord` rows
are the mechanical consequence of Ruby blocks becoming trailing TS parameters.

`connection_adapters/sqlite3_adapter.rb:561` declares
`def alter_table(table_name, foreign_keys = foreign_keys(table_name), check_constraints = check_constraints(table_name), **options)`
and every caller in that file writes `alter_table(table_name) do |definition|`.
TS has no block syntax, so the callback is a trailing parameter and the port
must pad the defaulted parameters it skips over:
`alterTable(tableName, null, null, null, (definition) => ...)`. The comparator
reads `(ref:tableName)` vs `(ref:tableName, nil, nil, nil)` and flags all 8
sqlite3 sites plus 3 more.

The padding is forced by the language and carries no information — the callee
applies exactly the default expressions Ruby would.

## Acceptance criteria

1. When the TS argument list is the Ruby list followed only by `nil` padding
   and a trailing function argument, and the Ruby call passes a block, the
   comparison ignores the padding.
2. The rule fires only when the callee's TS signature actually defaults those
   parameters — a `nil` the callee treats as a value is still a mismatch.
3. The 11 bucket-(b) rows go stale and are deleted from the baseline.
4. `pnpm parity:api:calls:args` is green and the total row count strictly
   decreases.
