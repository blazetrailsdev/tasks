---
title: "Arel visitors resolve Nodes through the ESM barrel, not the Autoload namespace"
status: done
updated: 2026-09-25
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 27
pr: trails#8094
claim: "2026-09-25T16:19:00Z"
assignee: "seat-nested-namespaces-on-active-record"
blocked-by: null
closed-reason: null
---

## Context

trails#8050 made the public `Arel.Nodes` the `Autoload`-extended object in
`packages/arel/src/namespaces.ts`, and every node class now seats itself on it. But five
visitors still resolve node constants through a second object, the frozen ESM barrel:
`import * as Nodes from "../nodes/index.js"` in `packages/arel/src/visitors/to-sql.ts:5`,
`mysql.ts:3`, `postgresql.ts:1`, `sqlite.ts:1` and `dot.ts:1`.

In Ruby there is only one `Arel::Nodes`. `Arel::Visitors::ToSql`
(`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb`) names `Nodes::SqlLiteral`,
`Nodes::BindParam` and similar constants, and they resolve lexically against that module.

## Converged shape

The visitors read `Nodes` from `../namespaces.js`, which is the same object the node readers and
public consumers use. Any eager-load edge the barrel import provided is kept explicitly
(e.g. a side-effect `import "../nodes/index.js"`) so that `dist-entry-modules.trails.test.ts`
stays green.

## Acceptance criteria

- No file under `packages/arel/src/visitors/` imports `../nodes/index.js` as a namespace.
- `Nodes.X` inside the visitors is the `namespaces.ts` object, in both value and type position.
- The arel suite, `dist-entry-modules.trails.test.ts`, `pnpm typecheck` and
  `parity:api:extra:gate` stay green.
