---
title: "arel: 12 parameter names and Table#name writability drift from Rails"
status: done
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: rails-deviation
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7123
claim: "2026-08-27T15:57:56Z"
assignee: "arel-attribute-inlines-four-mixins"
blocked-by: null
closed-reason: "Story file removed from the repo (rfcs/0023-surfaced-deviations/stories/arel-parameter-name-drift-sweep.md). Closed by ingest; no reason was recorded — use `tasks close` to state one."
---

## Context

A sweep of every arel method with a Ruby counterpart (282 matched, same
arity) finds 12 whose parameter names are not the Rails identifier camelCased —
the "free fidelity" CLAUDE.md asks for (`stmt` not `statement`):

| Rails                                                | trails                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `delete_manager.rb:11 from(relation)`                | `delete-manager.ts:35 from(table)`                               |
| `delete_manager.rb:27 having(expr)`                  | `delete-manager.ts:61 having(condition)`                         |
| `insert_manager.rb select(select)`                   | `insert-manager.ts select(selectManager)`                        |
| `insert_manager.rb create_values(values)`            | `insert-manager.ts createValues(row)`                            |
| `select_manager.rb:184 where(expr)`                  | `select-manager.ts where(condition)`                             |
| `select_manager.rb having(expr)`                     | `select-manager.ts having(condition)`                            |
| `select_manager.rb with(subqueries)`                 | `select-manager.ts with(ctes)`                                   |
| `select_manager.rb:172 order(*expr)` / `table.rb:58` | `order(...exprs)`                                                |
| `table.rb:66 project(*things)`                       | `table.ts:152 project(...projections)`                           |
| `alias_predication.rb:5 as(other)`                   | `nodes/*.ts as(aliasName)` (7 sites)                             |
| `visitors/dot.rb quote(string)`                      | `visitors/dot.ts quote(value)`                                   |
| `nodes/case.rb:8,14,24` (`expression`)               | `case.ts` (`operand`, `result`) — covered by the Case#when story |

Also `Table#name` is `attr_accessor` (table.rb:11) but `readonly` in
`table.ts:65`.

All are mechanical renames with no behaviour change; `parity:api` cannot see
them because it matches method names only.

## Acceptance criteria

- Each row above uses the Rails identifier, camelCased.
- `Table#name` is writable.
- No test renamed; `pnpm parity:api --package arel` stays 957/957.
