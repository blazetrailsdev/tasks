---
title: "Migration's method_missing delegations: receipt or relocate the 51 moved extras across migration.ts and the schema dumpers"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 260
priority: 2
pr: null
claim: null
assignee: null
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
exactly as the `receipt-*` novel-burndown stories were. **This story is the migration area:
51 names across 4 files.**

Rails' `Migration#method_missing` (`activerecord/lib/active_record/migration.rb:1044-1059`) forwards any
unknown message to the connection inside `say_with_time`, so `migration.rb` defines no
`add_column`, `add_index`, `change_table_comment` or the other 44 names trails spells out
explicitly on `Migration`. Rails DOES define each of them — on the adapter, in
`connection_adapters/abstract/schema_statements.rb` — which is exactly what makes them
`moved` rather than `novel`. The explicit spelling is the settled trails idiom for Ruby
`method_missing` (CLAUDE.md, "Ruby kwargs, blocks, and `method_missing` each have a settled
trails idiom"), so most of this area resolves by receipt citing `migration.rb:1044`, not by
deletion.

### The population

- `migration.ts` (`migration.rb`) — 47: addBelongsTo, addCheckConstraint, addColumn, addColumns, addForeignKey, addIndex, addReference, addTimestamps, addUniqueConstraint, change, changeColumn, changeColumnComment, changeColumnDefault, changeColumnNull, changeTableComment, columnExists, columns, createEnum, disableExtension, dropEnum, dropJoinTable, enableExtension, foreignKeys, get, indexes, indexExists, indexName, primaryKey, removeBelongsTo, removeCheckConstraint, removeColumn, removeColumns, removeForeignKey, removeIndex, removeReference, removeTimestamps, removeUniqueConstraint, renameColumn, renameEnumValue, renameIndex, renameTable, tableExists, tables, validateCheckConstraint, validateForeignKey, viewExists, views
- `migration/compatibility.ts` (`migration/compatibility.rb`) — 2: currentVersion, version
- `schema-dumper.ts` (`schema_dumper.rb`) — 1: dumpTableSchema
- `schema.ts` (`schema.rb`) — 1: constructor

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

`pnpm parity:api:extra --package activerecord` must show no row for any of the 51 names
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
