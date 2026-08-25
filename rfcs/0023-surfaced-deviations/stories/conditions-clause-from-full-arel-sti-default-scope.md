---
title: "Not-found conditions clause renders full arel (STI type_condition + default scope), not just where_clause"
status: done
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4113
claim: "2026-06-25T12:39:31Z"
assignee: "conditions-clause-from-full-arel-sti-default-scope"
blocked-by: null
---

## Context

`_conditionsClause()` (`packages/activerecord/src/relation.ts`, added by PR #4108)
builds the not-found `[WHERE …]` suffix from `this._whereClause` predicates only:

```ts
const sql = _whereClauseToSql(this._whereClause, connection);
```

Rails' `arel.where_sql(model)` (`finder_methods.rb:418` →
`select_manager.rb:192`) builds from the relation's _full arel_ — which includes
the STI `type_condition` and any default-scope WHEREs, not just the explicit
`where_clause`. So for an STI subclass or a default-scoped model the bracketed
clause diverges:

- `Reply.find_by!("1 = 0")` (Reply STI of Topic)
  - trails: `Couldn't find Reply with [WHERE (1 = 0)]`
  - Rails: `Couldn't find Reply with [WHERE "topics"."type" = 'Reply' AND (1 = 0)]`

The guard is identical (`unless where_clause.empty?` / `_whereClause.isEmpty()`),
so only the _content_ of the clause differs. Converge by rendering the WHERE SQL
from the built arel (the same node `_buildArel` / the select-manager produces)
rather than the raw `_whereClause`, so the STI type condition and default-scope
predicates are included.

## Acceptance criteria

- `_conditionsClause()` renders the WHERE SQL from the relation's full arel
  (including STI `type_condition` + default-scope WHEREs), matching Rails
  `arel.where_sql(model)` byte-for-byte.
- Test on an STI subclass (mirror a Rails finder test that asserts the type
  condition in a not-found message, if one exists; otherwise assert the
  `"type" = 'Reply'` fragment is present).
