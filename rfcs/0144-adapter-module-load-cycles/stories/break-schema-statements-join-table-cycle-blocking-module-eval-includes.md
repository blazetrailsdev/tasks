---
title: "Break the schema-statements -> join-table -> model-schema cycle so AbstractAdapter's includes can return to the class body"
status: done
updated: 2026-09-10
rfc: "0144-adapter-module-load-cycles"
cluster: null
packages: []
deps: ["association-tdz-on-entry-module"]
deps-rfc: []
est-loc: 150
priority: null
pr: trails#7678
claim: "2026-09-10T22:15:10Z"
assignee: "break-schema-statements-join-table-cycle-blocking-module-eval-includes"
blocked-by: null
closed-reason: null
---

## Context

`abstract-adapter-mixin-wiring-restore-module-eval` is blocked (PR #7042) on a
module-eval cycle, and this story is the blocker itself.

Rails applies every AbstractAdapter mixin as a plain `include` in the class body
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:50-56`):

```ruby
include Quoting, Savepoints, DatabaseLimits
include DatabaseStatements
include SchemaStatements
include QueryCache
```

trails defers all of it into `ensureAbstractAdapterMixinsApplied()`, run lazily
from the first `AbstractAdapter` construction
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, the block
below the class). That deferral is a trails-only mechanism and it is what
`0025-fidelity-verification-tooling/extractor-detect-non-top-level-includes`
exists to see past.

PR #7042 measured what actually blocks the restore. Moving the block to module
scope and entering the graph at `SchemaStatements` throws
`TypeError: Cannot convert undefined or null to object` from
`packages/activesupport/src/include.ts` — `include(AbstractAdapter,
SchemaStatements)` reads `SchemaStatements` while it is still uninitialised, on:

```text
connection-adapters/abstract/schema-statements.ts
  -> migration/join-table.ts          (value import, joinTableName)
  -> model-schema.ts                  (value import, deriveJoinTableName)
  -> connection-handling.ts
  -> connection-adapters.ts
  -> connection-adapters/abstract-adapter.ts
```

PR #5775 removed the `... -> base.ts -> abstract-adapter.ts` leg that
`abstract-adapter.ts`'s comment used to cite (guarded by
`scripts/test-deps/base-import-cycle.test.ts`), but this leg survives it. The
comment in `abstract-adapter.ts` now names this cycle.

Note the first hop is Rails' own structure, not a trails invention:
`Migration::JoinTable#join_table_name` delegates to
`ModelSchema.derive_join_table_name`
(`vendor/rails/activerecord/lib/active_record/migration/join_table.rb:11-13`).
Ruby resolves that constant by autoload when the method runs, which is exactly
the call-time resolution ESM has no equivalent for.

## Converged shape

Break the cycle so `include(AbstractAdapter, …)` can run at module scope and the
class body matches abstract_adapter.rb:50-56.

Candidate approaches, in preference order:

1. Make the `migration/join-table.ts -> model-schema.ts` edge non-eager. This is
   the hop Ruby resolves at call time, so it is the honest place to defer — see
   CLAUDE.md, "Call-time constant resolution (Ruby autoload → the zero-import
   slot)". A slot module is the settled shape; confirm it actually closes the
   cycle before reaching for one.
2. If some other hop turns out to be a trails-only edge, cut that instead.

As re-measured below, approach 1 alone is not enough on current main: the
`migration.ts:47` `DEFAULT_ENV` hop must also become a zero-import slot.

Do NOT re-document the deferral again — #7042 already did that, and the
deviation register is a burndown ledger, not permission.

## Re-measured on main 13ca39d0b (2026-09-10)

Story `remeasure-join-table-cut-against-current-main` re-ran the cut. The
earlier blocker (`associations.ts:6` force-loading `collection-proxy.ts`) is
retired by PR 7061 and no longer applies.

- Cutting only `migration/join-table.ts -> model-schema.ts` with a zero-import
  slot, with the mixin block at module scope: AR suite files
  (`migration/columns.test.ts`, `associations/has-many-associations.test.ts`)
  collect and pass. Plain-node imports of the built `dist` entered at
  `relation.js`, `associations.js`, `model-schema.js`,
  `associations/collection-proxy.js`, `abstract-adapter.js`, `base.js` and
  `index.js` all load. `associations.ts:3`'s bare `import "./relation.js"` is
  **not** load-bearing: with it deleted as well, every one of those entries
  still loads.
- `adapter-graph-import-tdz.test.ts` and a plain-node entry at
  `connection-adapters/abstract/schema-statements.js` still fail
  (`include(AbstractAdapter, DatabaseStatements)` reads undefined under vitest,
  `Cannot access 'SchemaStatements' before initialization` under node) through a
  second leg:

  ```text
  connection-adapters/abstract/schema-statements.ts
    -> migration/command-recorder.ts   (:4, IrreversibleMigration)
    -> migration.ts                    (:47, DEFAULT_ENV)
    -> connection-handling.ts
    -> connection-adapters.ts
    -> connection-adapters/abstract-adapter.ts
  ```

- Cutting `migration.ts:47` as well makes `adapter-graph-import-tdz.test.ts`
  green, and the node entry at `schema-statements.js` loads.

That second hop is also one Ruby resolves at call time: `migration.rb:676,773,1341`
name `ActiveRecord::ConnectionHandling::DEFAULT_ENV` inside method bodies
(defined at `connection_handling.rb:7`). So the converged shape is **two**
zero-import slots — one for `deriveJoinTableName` (set by `model-schema.ts`),
one for `DEFAULT_ENV` (set by `connection-handling.ts`) — plus moving the mixin
block to module scope.

## Acceptance criteria

- [ ] Two zero-import slots, each set at the bottom of its defining module:
      `deriveJoinTableName` (read by `migration/join-table.ts`, set by
      `model-schema.ts`) and `DEFAULT_ENV` (read by `migration.ts`, set by
      `connection-handling.ts`). Both are added to trails CLAUDE.md's
      "Call-time constant resolution" slot list.
- [ ] The mixin block runs at module-evaluation time;
      `ensureAbstractAdapterMixinsApplied` and its call site in the ctor are
      deleted.
- [ ] `pnpm vitest run scripts/test-deps/` passes — in particular
      `adapter-graph-import-tdz.test.ts` (enters at `SchemaStatements`),
      `base-import-cycle.test.ts`, and
      `pg-schema-definitions-import-tdz.test.ts`.
- [ ] Verified with a plain-node import of the BUILT `dist/**.js` modules as
      entry modules, not only under vitest — a vitest run enters the funnel
      module first and masks the TDZ.
- [ ] Unblock and close `abstract-adapter-mixin-wiring-restore-module-eval`.
- [ ] Check whether
      `0025-fidelity-verification-tooling/extractor-detect-non-top-level-includes`
      is still needed for this file.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
