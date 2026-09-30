---
title: "arel: restore the 10 Rails branches arel ports drop (report-arms missing rows)"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel"]
deps: ["arel-visitor-dispatch-cache-and-visit-rescue-arm"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=arel --direction=missing` lists **10** arel pairs whose TS
body omits a branch Rails takes (only the `throw` token is gated; `if`/`loop`/`try`/`rescue` are
report-only per RFC 0113, so nothing stops these regressing):

- `packages/arel/src/nodes/bound-sql-literal.ts#constructor` — `-if -if`
- `packages/arel/src/select-manager.ts#group` — `-if`
- `packages/arel/src/select-manager.ts#with` — `-if`
- `packages/arel/src/select-manager.ts#collapse` — `-if`
- `packages/arel/src/table.ts#constructor` — `-if`
- `packages/arel/src/table.ts#get` — `-if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesInsertStatement` — `-loop +if +if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesBoundSqlLiteral` — `-if -if -if -if -if +loop`
- `packages/arel/src/visitors/to-sql.ts#prepareUpdateStatement` — `-if`

(`visitors/visitor.ts#visit` is converged by `arel-visitor-dispatch-cache-and-visit-rescue-arm`.)

## Acceptance criteria

- [ ] Each pair's branches match its Rails body: same guards, same order, same early returns (CLAUDE.md § "Control flow").
- [ ] `pnpm parity:api:arms:report --package=arel --direction=missing` reports **0** rows.
- [ ] Rails tests that exercise the restored branch are ported or already green.
