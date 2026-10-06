---
title: "finder-methods.js TDZ-crashes as an entry module; ordered_relation should self-call model.query_constraints_list"
status: draft
updated: 2026-10-06
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

Importing the built `packages/activerecord/dist/relation/finder-methods.js` as an entry module throws:

```text
Cannot access 'FinderMethods' before initialization
```

Reproduce (after `pnpm build`):

```bash
cd packages/activerecord && node -e "import('./dist/relation/finder-methods.js')"
```

Seen on main at 7c42115e35 and unchanged by trails#8585. `relation.js`, `relation/query-methods.js`, `relation/delegation.js`, `signed-id.js` and `token-for.js` all import cleanly as entry modules.

`relation/finder-methods.ts` has one runtime import that reaches the model layer: `import { queryConstraintsList as _queryConstraintsListFn } from "../persistence.js"` (`finder-methods.ts:21`), used as `_queryConstraintsListFn.call(mc)` in `orderedRelation` and `_orderColumns`. That edge loads `persistence.ts` and, through it, `relation.ts`, whose module-scope `include(Relation, FinderMethods)` reads `FinderMethods` while `finder-methods.ts` is still evaluating. The edge was not traced module by module; confirm it first.

Rails has no such edge. `FinderMethods#ordered_relation` / `#_order_columns` (`activerecord/lib/active_record/relation/finder_methods.rb`) call `model.query_constraints_list` on the receiver, a class method defined at `activerecord/lib/active_record/persistence.rb:223`. The converged shape is the self-call `this.model.queryConstraintsList()` (declared on `FinderRelation["_model"]`), which drops the import and the cycle. This is the same shape trails#8585 used for `applyJoinDependency`, which calls `this.constructJoinDependency(...)` rather than importing `query-methods.ts`.

Sibling: `relation-tdz-on-entry-module` covers `relation.js` as the entry module, not this one.

## Acceptance criteria

- [ ] `node -e "import('./dist/relation/finder-methods.js')"` from `packages/activerecord` resolves, verified against the built `dist` (a vitest run enters through the funnel module and masks the TDZ).
- [ ] `orderedRelation` and `_orderColumns` call `query_constraints_list` on the model as Rails does; `finder-methods.ts` no longer imports `../persistence.js`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
