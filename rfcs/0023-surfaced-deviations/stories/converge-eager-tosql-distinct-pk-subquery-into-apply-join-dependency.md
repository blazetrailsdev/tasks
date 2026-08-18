---
title: "Converge or record the toSql eager distinct-pk inline subquery deviation"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into converge-relation-subquery-distinct-pk-materialization (both are the sync-path-cannot-execute half of distinct_relation_for_primary_key)"
---

## Context

Surfaced while converging the live eager path onto `build_arel` (#5909).

`_applyEagerJoinDependency` (`packages/activerecord/src/relation.ts`) now mirrors
Rails `apply_join_dependency` (`finder_methods.rb:456-488`), including the
limit/offset rewrite for non-limitable reflections. Rails resolves that case by
EXECUTING `distinct_relation_for_primary_key`
(`finder_methods.rb:463`, `schema_statements.rb:1429-1452`) and rewriting the
relation as `pk IN (ids)` with limit/offset cleared.

trails does exactly that on the async path (`_materializeLimitedIds`, fed in as
`limitedIds`). The SYNCHRONOUS `toSql` path cannot execute a query, so it nests
the same DISTINCT-pk query inline as a subquery — `pk IN (SELECT DISTINCT pk …
LIMIT n)` — via `_buildEagerIdSubquery`. The relation-rewrite shape matches Rails
but the operand does not: Rails never emits a nested LIMIT subquery here, and
MariaDB rejects `IN (SELECT … LIMIT n)` in some positions
(ER_NOT_SUPPORTED_YET), which is why the async path materializes instead.

This is the THIRD site implementing Rails' single `distinct_relation_for_primary_key`.
The other two are tracked by
`converge-eager-count-distinct-pk-materialization-into-apply-join-dependency`
(calculations' inline version) and `relation-handler-distinct-pk-materialization`
(the predicate-builder throw). Converging all three means giving
`applyJoinDependency` one async materialization path; this story covers the
`toSql`/`_buildEagerSql` caller, which is the one with no async context at all
and so may need `toSql` to stay approximate by construction — in which case the
deviation should be recorded as PERMANENT with a `@noRailsEquivalent`-style
justification rather than silently carried.

## Acceptance criteria

- Either `_buildEagerSql`'s eager limit/offset path routes through the same
  materialization the async path uses, or the inline-subquery operand is
  documented as a permanent, structurally-forced deviation with the Rails
  `file:line` it approximates.
- `_buildEagerIdSubquery` has exactly one remaining caller shape, or is removed.
- Coordinate with the two sibling stories above so the three sites converge on
  one implementation rather than three.
