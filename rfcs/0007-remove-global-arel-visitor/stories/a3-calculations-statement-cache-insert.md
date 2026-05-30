---
title: "Phase A3 — route calculations / statement-cache / insert-all through connection.toSql"
status: ready
rfc: "0007-remove-global-arel-visitor"
cluster: arel-visitor
deps: []
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Route the remaining in-scope callers through `connection.toSql`:

- `relation/calculations.ts:261/297` — `rel._modelClass.connection` (used two
  lines later for `selectAll`)
- `statement-cache.ts:214` — has a `connection` param
- `insert-all.ts:133` — `this.connection.executeMutation(builder.toSql())`

See RFC 0007 §Plan (Phase A3).

## Acceptance criteria

- [ ] These callers compile via `connection.toSql(node)`
- [ ] No global-fallback `.toSql()` left at these sites
- [ ] Dialect SQL unchanged in existing tests

## Notes

From the arel-visitor plan (Phase A3).
