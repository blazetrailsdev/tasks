---
title: "audit disable_joins singular-association load for Rails' ordered scope.first behavior"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-21T02:07:30Z"
assignee: "disable-joins-singular-load-ordering"
blocked-by: null
---

## Context

Rails' `SingularAssociation#find_target` (`singular_association.rb:47`) has two
branches:

- normal: `super.then(&:first)` — `Association#find_target` runs the scope SQL
  and takes `Array#first` (unordered LIMIT 1).
- **`disable_joins`: `scope.first`** (or `scope.load_async.then(&:first)`) —
  which routes through `Relation#first` → `ordered_relation`, so it **adds
  `ORDER BY` primary key**.

PR #3720 converged the non-disable-joins singular-load sites in
`packages/activerecord/src/associations.ts` to `rel.take()` (unordered),
matching the normal branch. The `disable_joins` singular path in trails
(`loadHasOneThrough` / `_loadThroughViaDisableJoinsScope`) was NOT audited in
that PR for the ordered-`first` behavior. We need to confirm trails' disable-
joins has_one/belongs_to load emits the Rails-faithful `ORDER BY pk LIMIT 1`,
and fix it if it currently uses an unordered terminator.

## Acceptance criteria

- [ ] Audit the disable_joins singular-association load path in trails; confirm
      it orders by primary key (Rails `scope.first` semantics), not an unordered
      `take`.
- [ ] If it diverges, route it through the ordered `first` path (inside the
      `with_connection` shim, per PR #3720) and add/extend a test asserting the
      `ORDER BY` is present for disable_joins singular loads.
- [ ] Green on SQLite/PG/MySQL.
