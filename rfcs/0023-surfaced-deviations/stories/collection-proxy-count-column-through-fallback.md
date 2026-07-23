---
title: "CollectionProxy#count(column) silently ignored on through loader fallback"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5125 added an optional `column` parameter to `CollectionProxy#count`
(`packages/activerecord/src/associations/collection-proxy.ts:1671`, mirroring
Rails `Calculations#count(column_name)`) and threaded it through the
scope fast-path (`Relation.prototype.count.call(scope, column)`) and the
disable-joins DJAR path (`DisableJoinsAssociationRelation#count(column)`,
`disable-joins-association-relation.ts:414`).

Two through-association fallback arms still ignore the column silently:

- the loader fallback for non-routable through shapes
  (`collection-proxy.ts:~1725`, `loadHasMany(...).length`) — Rails
  `count(:col)` counts non-NULL values of that column, `results.length`
  counts all rows;
- (related pre-existing note) that loader arm is already flagged as
  divergent — see the task #25 comment at the call site.

Rails source: `activerecord/lib/active_record/relation/calculations.rb`
(`count(column_name = nil)`), CollectionProxy delegates unchanged.

## Acceptance criteria

- `proxy.count("col")` on a non-routable through shape either counts
  non-NULL `col` values (Rails semantics) or raises loudly — no silent
  all-rows count.
- Test covering a through association `count(:column)` with NULLs in the
  counted column.
