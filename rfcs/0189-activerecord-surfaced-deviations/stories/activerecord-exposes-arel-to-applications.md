---
title: "An application cannot reach Arel nodes: @blazetrails/arel is only a transitive dependency of activerecord"
status: draft
updated: 2026-10-30
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found on trailmap#99. `/search` needed `LENGTH(x) - LENGTH(REPLACE(x, needle, ''))`. In Rails an app has `Arel::Nodes::NamedFunction` from activerecord. In trails, `@blazetrails/arel` is a dependency of `@blazetrails/activerecord` (its package.json) but is neither re-exported by it nor resolvable from a pnpm application: `packages/activerecord/src/index.ts` exposes no Arel namespace. Only the node methods reachable from `arelTable.get(...)` work, such as `.lower()`.

## Acceptance criteria

- An application depending only on `@blazetrails/activerecord` can build `Arel.Nodes.NamedFunction` and `Arel.Nodes.Quoted`.
- `trails new` output typechecks such an import, with a test in activerecord.
