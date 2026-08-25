---
title: "Restore Rails' collector parameter position across the arel visitor helpers"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6355
claim: "2026-08-11T13:16:06Z"
assignee: "naming-burndown-activesupport"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0025 `## Call-argument fidelity` spike (2026-08-08), which
prototyped a call-**argument** parity dimension. This is its single highest-value
finding, and it needs no tooling to fix — the divergence is already located.

trails moved Rails' `collector` parameter to the **last** position across the
entire arel visitor-helper family. Rails threads the collector as the parameter
immediately after the node; trails puts it at the end:

| Rails                                                                                  | trails                                                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `collect_nodes_for(nodes, collector, spacer, connector = ", ")` `to_sql.rb:179`        | `collectNodesFor(nodes, spacer, connector = ", ", collector)` `to-sql.ts:646`       |
| `inject_join(list, collector, join_str)` `to_sql.rb:897`                               | `injectJoin(list, joinStr, collector)` `to-sql.ts:1721`                             |
| `infix_value(o, collector, value)` `to_sql.rb:957`                                     | `infixValue(o, value, collector)` `to-sql.ts:1823`                                  |
| `infix_value_with_paren(o, collector, value, suppress_parens = false)` `to_sql.rb:963` | `infixValueWithParen(o, value, suppressParens = false, collector)` `to-sql.ts:1839` |
| `grouping_parentheses(o, collector, always_wrap_selects = true)` `to_sql.rb:981`       | `groupingParentheses(o, alwaysWrapSelects = true, collector)` `to-sql.ts:1868`      |

Plus the SQLite override: `sqlite.rb:39` vs `sqlite.ts:89`.

This is a direct CLAUDE.md violation — "A local or parameter keeps the Rails
identifier… Same for parameter _order_ and defaults" — and it has been invisible
to every gate in the repo. `arity.ts` cannot see it (the parameter counts match
exactly), `parity:api` cannot see it (the names match), and `parity:api:calls` cannot
see it (the calls are all made). Only an argument-level comparison surfaces it;
the spike counted 23 flagged call sites from this one cause, a third of arel's
entire flagged population.

**Independent TS defect the reorder also fixes.** Three of the five signatures
now declare a **defaulted parameter before a required one**:
`connector = ", "` before `collector` (`to-sql.ts:648-650`),
`suppressParens = false` before `collector` (`to-sql.ts:1842-1843`, and the same
in `sqlite.ts:92-93`), `alwaysWrapSelects = true` before `collector`
(`to-sql.ts:1870-1871`). In TypeScript that makes the default unreachable —
every caller must pass the value explicitly — so the defaults Rails actually
relies on are dead. Restoring Rails' order puts the defaults back in trailing
position where they work.

Scope: 31 call sites across three files — `injectJoin` 13, `infixValueWithParen`
6, `collectNodesFor` 5, `groupingParentheses` 5, `infixValue` 2 — in
`packages/arel/src/visitors/{to-sql,sqlite,mysql}.ts`. All six declarations are
`protected`, so there are no callers outside `packages/arel/src/visitors/`.

**File-overlap warning.** Two RFC 0084 stories are `ready` against these exact
methods for a _different_ defect (helpers inlined instead of called):
`arel-tosql-statement-visitor-helper-calls` and
`arel-dialect-visitor-helper-calls`. Per this RFC's operating rule, coordinate:
either land this first as the mechanical reorder and let those rebase, or fold
it into whichever of them is claimed first. Do not run all three in parallel.

## Acceptance criteria

1. All six declarations take Rails' parameter order and Rails' parameter names,
   including the defaults in Rails' trailing positions:
   `collectNodesFor(nodes, collector, spacer, connector = ", ")`,
   `injectJoin(list, collector, joinStr)`, `infixValue(o, collector, value)`,
   `infixValueWithParen(o, collector, value, suppressParens = false)`,
   `groupingParentheses(o, collector, alwaysWrapSelects = true)`, and the
   `sqlite.ts` override matching `sqlite.rb:39`.
2. All 31 call sites are updated; no defaulted parameter precedes a required one
   in any of the six signatures afterwards.
3. Call sites that Rails leaves to a default stop passing it explicitly — e.g.
   Rails `collect_nodes_for(o.groups, collector, " GROUP BY ")` takes the
   `connector` default, so the port must not spell `", "` at that site.
4. `pnpm vitest run packages/arel` is green, and the generated SQL is
   byte-identical before and after (this is a pure signature reorder — if any
   query text moves, a call site was rewritten wrong).
5. `pnpm parity:api:calls` shows no new rows and `pnpm parity:api:extra --package arel` is
   unchanged.
6. Out of scope, and **not** to be swept in: the other two arel findings in the
   RFC 0025 spike write-up (`appendEscape` is an extracted helper Rails does not
   have, `to-sql.ts:1044`; `UnaryOperation.operand` shadows Rails' `Unary#expr`,
   `unary-operation.ts:19`). File them separately if unowned.
