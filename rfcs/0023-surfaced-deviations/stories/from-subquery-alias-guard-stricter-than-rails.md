---
title: "from() rejects subquery aliases Rails accepts (TS-only safe-identifier guard)"
status: draft
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during `from-setop-subquery-ast` (PR #3185). `buildFrom`
(`packages/activerecord/src/relation/query-methods.ts`) throws
`argumentError("Invalid subquery alias ...: must be a safe SQL identifier")`
when a `from(relation, alias)` alias fails a `^[A-Za-z_][A-Za-z0-9_]*$` regex.

Rails has no such gate: `build_from` does only `name ||= "subquery";
opts.arel.as(name.to_s)` (`query_methods.rb:1783-1792`), storing the
caller-provided `subquery_name` verbatim and wrapping it in a `Nodes::SqlLiteral`
(`arel/select_manager.rb:48-50`). PR #3185 already removed the guard from the
set-op `from()` branch (alias passed verbatim, Rails-faithful), leaving the
plain-string Relation branch as the lone divergence — and an asymmetry between
the two `from(Relation)` paths.

Work: decide whether to drop the safe-identifier guard from the normal
subquery branch to match Rails (and remove the asymmetry), or keep it as a
deliberate trails hardening and document the divergence. If kept, note why
trails is stricter (raw alias injection / invalid SQL fail-fast).

## Acceptance criteria

- [ ] Normal `from(relation, alias)` alias handling either matches Rails
      (verbatim, no regex) or the divergence is documented with rationale.
- [ ] The two `from(Relation)` branches (set-op vs plain) are consistent.
