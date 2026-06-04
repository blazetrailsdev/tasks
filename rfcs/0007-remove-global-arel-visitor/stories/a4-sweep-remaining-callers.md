---
title: "Phase A4 — sweep remaining direct .toSql() production callers"
status: done
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
