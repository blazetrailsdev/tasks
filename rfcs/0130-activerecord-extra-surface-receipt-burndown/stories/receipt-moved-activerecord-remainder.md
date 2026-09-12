---
title: "Receipt or relocate the last 59 moved extras across tasks/, locking/, relation/ and the remaining root files"
status: done
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 340
priority: 3
pr: trails#7730
claim: "2026-09-12T16:19:09Z"
assignee: "receipt-moved-activerecord-remainder"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` measures `novel: 0` but **396 unreceipted
moved extras** (measured 2026-09-12 off a full `pnpm build` + `pnpm parity:api`). A moved extra
is a public TS name Rails DOES define — just in a different `.rb` — and it counts against
the `total` dimension of `scripts/api-compare/extra-surface-mark.json`, which
`activerecord`'s row currently pins at 396.

`enrol-activerecord-in-tagged-only-mode` cannot land until `total` reaches 0, because its
acceptance criterion is that activerecord needs **no row** in the mark file, and the mark's
module comment is explicit that tagged-only mode does NOT drop the `total` dimension:
`parity:api:moves` only reports, and `blazetrails/rails-file-structure-method-order`
orders members within one file's container and so cannot see a cross-file relocation at all
(RFC 0127's `gate-the-wrong-file-moves-population` records the same finding against
PR #7283). RFC 0130's Non-goals entry claiming tagged-only mode drops `total` predates that
and is stale.

396 receipts across 125 files is far past one PR's LOC ceiling, so the burndown is cut by area
exactly as the `receipt-*` novel-burndown stories were. **This story is the remainder area:
59 names across 35 files.**

The tail: 35 files with one to seven names each. Three systematic groups run through
it — the `InstanceMethods` / `ClassMethods` mixin containers (the TS carrier for Ruby
`module InstanceMethods` inside a Concern, which `SKIP_GROUPS` in
`scripts/parity/conventions.ts` does not cover on the extra side), the `toString` /
`toJSON` JS-idiom names whose Ruby counterparts are `to_s` / `as_json` on an ancestor, and
the `tasks/*-database-tasks.ts` `register` seats Rails performs at
`activerecord/lib/active_record/tasks/database_tasks.rb:73` (`register_task`) from the railtie rather than
in the task class. This story is the one that takes activerecord's `total` to 0, so it also
re-measures and states the final figure.

### The population

- `persistence.ts` (`persistence.rb`) — 4: clone, InstanceMethods, slice, valuesAt
- `tasks/database-tasks.ts` (`tasks/database_tasks.rb`) — 4: constructor, dumpSchemaAfterMigration, dumpSchemas, schemaFormat
- `disable-joins-association-relation.ts` (`disable_joins_association_relation.rb`) — 3: calculate, count, pluck
- `internal-metadata.ts` (`internal_metadata.rb`) — 3: deleteAll, get, set
- `locking/optimistic.ts` (`locking/optimistic.rb`) — 3: cast, InstanceMethods, type
- `timestamp.ts` (`timestamp.rb`) — 3: InstanceMethods, touch, touchAll
- `nested-attributes.ts` (`nested_attributes.rb`) — 2: constructor, InstanceMethods
- `query-logs.ts` (`query_logs.rb`) — 2: formatter, updateContext
- `readonly-attributes.ts` (`readonly_attributes.rb`) — 2: attribute, constructor
- `relation.ts` (`relation.rb`) — 2: isPresent, presence
- `relation/predicate-builder/deferred-distinct-pk-in.ts` _(no Rails counterpart)_ — 2: constructor, invert
- `relation/where-clause.ts` (`relation/where_clause.rb`) — 2: clear, clone
- `runtime-registry.ts` (`runtime_registry.rb`) — 2: record, stats
- `testing/method-call-assertions.ts` _(no Rails counterpart)_ — 2: assertCalledOnInstanceOf, assertNotCalledOnInstanceOf
- `type/serialized.ts` (`type/serialized.rb`) — 2: isBinary, isChanged
- `validations.ts` (`validations.rb`) — 2: ClassMethods, readAttributeForValidation
- `enum.ts` (`enum.rb`) — 1: serializeCastValue
- `fixtures.ts` (`fixtures.rb`) — 1: ref
- `locking/pessimistic.ts` (`locking/pessimistic.rb`) — 1: InstanceMethods
- `model-schema.ts` (`model_schema.rb`) — 1: InstanceMethods
- `normalization.ts` (`normalization.rb`) — 1: InstanceMethods
- `querying.ts` (`querying.rb`) — 1: isEmpty
- `relation/batches/batch-enumerator.ts` (`relation/batches/batch_enumerator.rb`) — 1: then
- `relation/delegation.ts` (`relation/delegation.rb`) — 1: constructor
- `scoping.ts` (`scoping.rb`) — 1: scopeFor
- `scoping/named.ts` (`scoping/named.rb`) — 1: isDangerousClassMethod
- `secure-token.ts` (`secure_token.rb`) — 1: constructor
- `statement-cache.ts` (`statement_cache.rb`) — 1: append
- `tasks/mysql-database-tasks.ts` (`tasks/mysql_database_tasks.rb`) — 1: register
- `tasks/postgresql-database-tasks.ts` (`tasks/postgresql_database_tasks.rb`) — 1: register
- `tasks/sqlite-database-tasks.ts` (`tasks/sqlite_database_tasks.rb`) — 1: register
- `test-fixtures/use-transactional-tests.ts` _(no Rails counterpart)_ — 1: useTransactionalTests
- `touch-later.ts` (`touch_later.rb`) — 1: InstanceMethods
- `translation.ts` (`translation.rb`) — 1: ClassMethods
- `type-virtualization/walker.ts` _(no Rails counterpart)_ — 1: walk

### How a name resolves

Each name resolves one of four ways — the story must say which way each went, and
"add a tag" is not a plan (RFC 0130, "The 342 are not one population"):

1. **Delete it.** Extra surface whose call site can move to the ported method, or which
   has no call site at all. Preferred: it lowers `total` without a receipt.
2. **Relocate it** to the TS file mirroring the `.rb` that defines it. This is the
   convergence `moved` is actually asking for, and it lowers `total` too.
3. **Credit it in the extractor**, where the name is Rails surface the Ruby extractor
   cannot see (a `define_model_callbacks` product, a `delegate`, a generated reader).
   A receipt on a faithful port is a lie about it; the fix lands once for the group.
4. **`@noRailsEquivalent PERMANENT`** for a genuine, already-ratified TypeScript language
   shortcoming, or **`@noRailsEquivalent CONVERGEABLE <story-id>`** with a filed story.
   A bare `CONVERGEABLE` with no id is half a receipt and the run says so.

Write the receipt as a MULTI-LINE JSDoc block: a one-line `/** @noRailsEquivalent … */`
does not register, and `no-freeform-comments` autofixes prose out of the block, so the
tag must stand alone and the reasoning belongs in the story it cites.

The census above is a snapshot, not a target — sibling PRs move it. Re-measure at claim
time with `pnpm build && pnpm parity:api && pnpm parity:api:extra --package activerecord`
and gate on this area reaching 0, not on the absolute number in this body (a stale census
already cost a blocking review on #7516).

## Acceptance criteria

- Every moved extra in this area is deleted, relocated, credited in the extractor, or
  receipted; `pnpm parity:api:extra --package activerecord` reports 0 extras for each file
  listed above.
- activerecord's `total` in `scripts/api-compare/extra-surface-mark.json` is tightened in
  the same PR with `pnpm parity:api:extra:tighten`. The mark is only-shrink and there is
  no reseed — a name that cannot be resolved gets a `CONVERGEABLE` receipt, not room.
- `pnpm parity:api:extra:gate` is green, and the unstated-permanence count in the
  extra-surface run does not rise.

The receipt form and the evidence it owes differ by whether the TS file has a Rails
counterpart, and the two are not interchangeable:

- **Matched files** (a `.rb` is named beside the file in the census above). Each surviving
  name carries its own `@noRailsEquivalent PERMANENT` / `CONVERGEABLE <story-id>` tag **at
  its declaration**, and cites the `vendor/rails/` `file:line` of the Rails name it stands
  against — in the story it points at, since the tag itself cannot carry prose.
  `fileTagVerdict` refuses a file-level blanket here, so do not reach for one.
- **No-counterpart files** (marked _(no Rails counterpart)_ above). There is no Rails name
  to cite and no per-declaration tag is required: a single FILE-level
  `@noRailsEquivalent PERMANENT` verdict covers the file. Its evidence is different in kind
  and must be stated in the PR body — that **no** `.rb` maps onto the file (shown by the
  census row, and by the file's absence from `rails-api.json`), plus what the file is the TS
  spelling of and why Rails needs no such file. Where the file IS the TS spelling of a Ruby
  construct that has no file of its own — a bare Hash, a barrel, a JS-idiom shim — say which
  construct and cite where Rails uses it.
- A file-level verdict is **not** available as a shortcut for a matched file, and a
  per-declaration tag on a no-counterpart file is not wrong, just unnecessary. Whichever
  form is used, a receipt in a file outside the measured population is a STALE tag, not a
  receipt (see Notes).

## Definition of done

A `@noRailsEquivalent` whose reason was generated rather than reasoned does NOT close this
story — that is the "tag all of them mechanically" alternative RFC 0130 rejected as "fast and
worthless". Route 1 (delete) and route 2 (relocate) have to be tried per name before a
receipt is written, which is what makes this a burndown rather than a `sed` script. Raising
activerecord's `total` mark does not close it either; the mark is only-shrink and there is no
reseed.

## Verification

```sh
pnpm build && pnpm parity:api                      # the manifests the measurement reads
pnpm parity:api:extra --package activerecord        # this area's files report 0 extras
pnpm parity:api:extra:tighten                       # writes `total` DOWN, never up
pnpm parity:api:extra:gate                          # green
```

`pnpm parity:api:extra --package activerecord` must show no row for any of the 59 names
listed above, and activerecord's `total` in `scripts/api-compare/extra-surface-mark.json`
must fall by the number this story resolved.

## Notes

Two checks are easy to miss and both are green locally / red in CI: `pnpm parity:api --extra`
does **not** run the STALE-tag gate, and `parity:api:extra:gate` does **not** run the
REDUNDANT-tag check — only `pnpm parity:api:extra --package <pkg>` prints the latter. So run
the `--package` form, not just the gate.

A receipt placed in a file outside the measured population — `src/test-helpers/**`,
`src/support/**` — is always a STALE tag: there is nothing there for it to suppress, and only
the CI compare job catches it.

This story's names are **disjoint from every name already carrying a receipt.** A receipted
name has been subtracted from the measurement, so it cannot appear in the census above — but
it can sit in the same FILE, and two sibling stories own those:
`converge-receipted-activerecord-root-and-adapter-names` holds the
`CONVERGEABLE`-receipted novel names and lists them per file, and
`receipt-connection-adapters-matched-files` (done, trails#7714) resolved the novel half of the
adapter files. Read the first one's table before editing any file this story names, so the two
PRs do not collide and a name it already owns is not re-resolved here.

Extra-surface totals move with **build state**, not with the commit: an unbuilt package's
types go unresolved and the methods carrying them drop out of the population. Always
`pnpm build` before measuring, and use `API_COMPARE_FORCE=1` if a warm cache is
under-reporting.
