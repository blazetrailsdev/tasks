---
title: "Make base.ts mixin wiring independent of module entry order"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 5775
claim: "2026-08-01T00:00:41Z"
assignee: "base-mixin-wiring-order-independent-module-init"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/base.ts` performs its entire mixin wiring in ~40
top-level statements at module-evaluation time (`base.ts:4802` onward):

```ts
extend(Base, ConnectionHandling.ClassMethods);
extend(Base, Inheritance.ClassMethods);
...
include(Base, _PrimaryKey);
```

Every one of those reads a binding from a module that is part of a cycle with
`base.ts`. ESM evaluates a cycle member's body before its in-progress
dependencies' bodies, so whether these reads see initialized bindings depends
entirely on which module the graph is entered through. Today it works by luck of
entry order, not by construction.

Measured 2026-07-31 while attempting
`migration-join-table-delegate-to-derive-join-table-name`. Adding a single
import edge (`migration/join-table.ts` -> `model-schema.js`, which Rails' own
`join_table.rb:12` delegation requires) flips the entry order and the graph dies:

```text
$ node -e 'await import("./dist/connection-adapters/abstract/schema-statements.js")'
ReferenceError: Cannot access 'ClassMethods' before initialization
    at dist/base.js:3168   <- extend(Base, ConnectionHandling.ClassMethods)
```

Instrumenting module body-eval order confirms the mechanism:

|                          | `connection-handling.js` body | `base.js` body |
| ------------------------ | ----------------------------- | -------------- |
| today                    | @55                           | @190 — safe    |
| with the join-table edge | never runs (in-progress)      | @176 — crashes |

The cycle is dense, not a single removable edge. The shortest runtime path is
`connection-handling -> connection-adapters -> connection-adapters/abstract/connection-pool -> schema-migration -> base`,
but cutting `schema-migration -> base` alone was tried and does **not** fix it —
`connection-adapters.js` is a barrel and `relation.js`, `insert-all.js`,
`internal-metadata.js`, `fixtures.js`, `scoping/named.js`, `schema-dumper.js`,
`migrator.js` and `test-adapter.js` all re-form the cycle.

Rails has no such hazard: `base.rb` does `extend ConnectionHandling` inside the
class body and Ruby autoload resolves each constant on first reference. Several
of our load-time edges are pure inventions — e.g. `schema_migration.rb` has
**zero** `require`s, yet `schema-migration.ts:8` statically imports `base.js`
just to read `Base.tableNamePrefix` inside the `tableName` getter
(`schema_migration.rb:50` resolves `ActiveRecord::Base` at call time).

`scripts/test-deps/adapter-graph-import-tdz.test.ts` is the only guard; it runs
in the **Unit Tests** job, not the AR suites, so typecheck, lint and every AR
suite pass while the graph is broken.

## Acceptance criteria

- `base.ts`'s mixin wiring no longer depends on module entry order — either the
  wiring stops running at module-evaluation time, or the cyclic load-time edges
  into `base.js` are removed so `base.ts` is guaranteed to evaluate after the
  modules it reads.
- Adding `import { deriveJoinTableName } from "../model-schema.js"` to
  `packages/activerecord/src/migration/join-table.ts` no longer breaks
  `scripts/test-deps/adapter-graph-import-tdz.test.ts`. That import is the
  acceptance probe; it does not have to ship here.
- Prefer removing the invented load-time edges (Rails resolves these constants
  at call time) over introducing a cycle-breaking shim or a new non-Rails file —
  a new file is its own api-compare deviation, and a ported method must stay in
  its Rails-layout file.
- `pnpm vitest run scripts/test-deps/adapter-graph-import-tdz.test.ts` passes,
  entered through `SchemaStatements` as it is today.

Unblocks `migration-join-table-delegate-to-derive-join-table-name`, and removes
the standing reason that `migration/join-table.ts` must stay import-leaf.
