---
title: "Phase A1 — route DDL/metadata toSql callers through connection.toSql"
status: done
updated: 2026-06-03
rfc: "0007-remove-global-arel-visitor"
cluster: arel-visitor
deps: []
deps-rfc: []
est-loc: 150
pr: 2920
claim: "2026-06-03T20:11:16Z"
assignee: "a1-ddl-metadata-callers"
blocked-by: null
---

## Context

Replace `node.toSql()` with `connection.toSql(node)` in the DDL/metadata cluster
(each caller already holds a connection/adapter):

- `schema-migration.ts` — `this._adapter.executeMutation(im.toSql())`
- `internal-metadata.ts` — `this._connection.execute(sm.toSql())`
- `migration.ts:1921` — `this.connection.executeMutation(td.toSql())`

See RFC 0007 §Plan (Phase A1).

## Acceptance criteria

- [ ] DDL/metadata callers compile SQL via `connection.toSql(node)`
- [ ] No `: x.toSql()` global-fallback left in these sites
- [ ] Existing tests assert dialect SQL unchanged (now connection-derived)

## Notes

Correctness, not just parity: the default `ToSql` visitor double-quotes
identifiers, so a bare `.toSql()` on MySQL emits wrong quoting unless the global
was synced. From the arel-visitor plan (Phase A1).
