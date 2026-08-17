---
title: "Converge JoinDependency#reflections onto join_root.drop(1)"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6673
claim: "2026-08-17T22:18:04Z"
assignee: "converge-collection-association-reader-reload-and-proxy"
blocked-by: null
closed-reason: null
---

# Converge JoinDependency#reflections onto join_root.drop(1)

## Context

`JoinDependency#reflections`
(activerecord/lib/active_record/associations/join_dependency.rb:81-83) is one
line over the join tree as an Enumerable:

```ruby
join_root.drop(1).map!(&:reflection)
```

trails' `get reflections`
(packages/activerecord/src/associations/join-dependency.ts) instead walks with
`this._joinRoot.eachChildren((parent, child) => ...)`, re-resolves each
reflection through `_reflectOnAssociation(parent.baseKlass, child.immediateAssocName)`
and skips nodes with `tableIndex < 0` — a different traversal that happens to
drop the root, plus a lookup Rails does not do (Rails reads `node.reflection`).

Surfaced by RFC 0106 wave 3, which recorded the gap as a per-row justification on
`reflections | drop` in
`call-mismatches-exclude/activerecord/associations/join-dependency.json`.

## Converged shape

Give the join-root node the depth-first enumeration Rails' `Enumerable` gives
`join_root`, so the body reads `[...this.joinRoot].slice(1).map((n) => n.reflection)`
over nodes that already carry their reflection. Then delete the row by hand via
`serializeBaseline` and lower the mark with
`pnpm parity:api:calls:tighten activerecord/associations/join-dependency.json`.

## Acceptance criteria

- [ ] `reflections` reads the reflection off each node, root skipped, no
      per-node re-resolution.
- [ ] The `reflections | drop` row is deleted; gate green, no `--write`.
