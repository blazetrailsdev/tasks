---
title: "receipt-moved-migration-method-missing-delegations"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
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
  carries a `@noRailsEquivalent PERMANENT` / `CONVERGEABLE <story-id>` receipt at its
  declaration; `pnpm parity:api:extra --package activerecord` reports 0 extras for each
  file listed above.
- activerecord's `total` in `scripts/api-compare/extra-surface-mark.json` is tightened in
  the same PR with `pnpm parity:api:extra:tighten`. The mark is only-shrink and there is
  no reseed — a name that cannot be resolved gets a `CONVERGEABLE` receipt, not room.
- `pnpm parity:api:extra:gate` is green, and the unstated-permanence count in the
  extra-surface run does not rise.
- Every receipt cites a `vendor/rails/` `file:line` for the Rails name it stands against,
  in the story it points at where the tag itself cannot carry prose.
