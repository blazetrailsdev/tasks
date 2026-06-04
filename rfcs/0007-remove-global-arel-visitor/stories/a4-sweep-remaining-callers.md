---
title: "Phase A4 — sweep remaining direct .toSql() production callers"
status: ready
rfc: "0007-remove-global-arel-visitor"
cluster: arel-visitor
deps:
  [
    "a1-ddl-metadata-callers",
    "a2-persistence-base-ternary",
    "a3-calculations-statement-cache-insert",
  ]
deps-rfc: []
est-loc: 100
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

After A1–A3, grep the remaining ~74 production `.toSql()` callers and route any
stragglers through `connection.toSql`. Confirm the long tail all have a
connection in scope; any genuine adapter-less site stays on the arel default
`ToSql` (acceptable — dialect-agnostic by definition).

See RFC 0007 §Plan (Phase A4) and §Risks.

## Acceptance criteria

- [ ] `grep` of production `.toSql()` callers shows all in-scope sites routed
      through `connection.toSql`
- [ ] Any genuine adapter-less caller documented as intentionally on the default
      `ToSql`
- [ ] Dialect SQL unchanged in existing tests

## Notes

From the arel-visitor plan (Phase A4). Runs after A1–A3 so the residual set is
known.

**State (2026-06-04 reconcile):** still open. A1/A2 done — `persistence.ts` has
0 direct `.toSql()` callers. **33 production callers remain**, concentrated in
connection-bearing files: `relation.ts` (13), `relation/query-methods.ts` (8),
`abstract/database-statements.ts` (2), plus singles in `timestamp.ts`,
`relation/{ruby-inspect,predicate-builder,calculations}.ts`, `insert-all.ts`,
`collection-proxy.ts`, and several adapter/schema files. These have a connection
in scope, so per the adapter-cleanup doc's PR C they should route through
`connection.visitor.compile` / `connection.toSql`. AR no longer injects a
dialect into the global (`setToSqlVisitor` has 0 AR callers — Phase B done);
arel's `setToSqlVisitor` + default `ToSql` stay (per §What stays). This is the
"~35-site `toSql` migration" that RFC 0010 defers here.
