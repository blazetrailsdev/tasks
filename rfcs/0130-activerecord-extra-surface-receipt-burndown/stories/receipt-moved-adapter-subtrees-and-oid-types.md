---
title: "connection-adapters/{postgresql,mysql,sqlite3}: receipt or relocate the 57 moved extras across the subtrees and the OID types"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 300
priority: 3
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
exactly as the `receipt-*` novel-burndown stories were. **This story is the adapter-subtrees area:
57 names across 25 files.**

The OID types (`oid/cidr.ts`, `oid/array.ts`, `oid/range.ts`, …) carry `cast`,
`deserialize`, `serialize` and `toString` overrides whose Rails counterparts sit on the
ActiveModel type ancestors (`activemodel/lib/active_model/type/value.rb:43-65`) rather than
in the adapter's `oid/*.rb` — so they score moved even where the port is faithful.
`postgresql/schema-statements.ts`'s `columns`/`tables`/`views`/`primaryKey` are the module
half of the sibling adapter-class story, and `postgresql/type-map-init.ts` and
`adapters/postgresql/utils.ts` have no Rails counterpart file, so a file-level tag is the
right form there.

### The population

- `connection-adapters/postgresql/schema-statements.ts` (`connection_adapters/postgresql/schema_statements.rb`) — 8: columns, logger, nativeDatabaseTypes, primaryKey, query, tableExists, tables, views
- `connection-adapters/postgresql/oid/cidr.ts` (`connection_adapters/postgresql/oid/cidr.rb`) — 6: cast, constructor, deserialize, IPAddr, prefix, toString
- `connection-adapters/postgresql/type-map-init.ts` _(no Rails counterpart)_ — 6: extractLimit, extractPrecision, extractScale, initializeTypeMap, registerClassWithLimit, registerClassWithPrecision
- `connection-adapters/mysql/database-statements.ts` (`connection_adapters/mysql/database_statements.rb`) — 5: execDelete, execInsert, execQuery, execUpdate, lastInsertedId
- `connection-adapters/sqlite3/database-statements.ts` (`connection_adapters/sqlite3/database_statements.rb`) — 5: execDelete, execInsert, execQuery, execUpdate, lastInsertedId
- `connection-adapters/postgresql/oid/array.ts` (`connection_adapters/postgresql/oid/array.rb`) — 4: decode, encode, name, toString
- `connection-adapters/mysql/column.ts` (`connection_adapters/mysql/column.rb`) — 2: constructor, encodeWith
- `connection-adapters/postgresql/oid/bit.ts` (`connection_adapters/postgresql/oid/bit.rb`) — 2: cast, deserialize
- `connection-adapters/postgresql/oid/interval.ts` (`connection_adapters/postgresql/oid/interval.rb`) — 2: cast, constructor
- `connection-adapters/postgresql/oid/range.ts` (`connection_adapters/postgresql/oid/range.rb`) — 2: cast, deserialize
- `adapters/postgresql/utils.ts` _(no Rails counterpart)_ — 1: extractSchemaQualifiedName
- `connection-adapters/mysql/quoting.ts` (`connection_adapters/mysql/quoting.rb`) — 1: quoteString
- `connection-adapters/mysql/schema-creation.ts` (`connection_adapters/mysql/schema_creation.rb`) — 1: constructor
- `connection-adapters/mysql/schema-dumper.ts` (`connection_adapters/mysql/schema_dumper.rb`) — 1: connection
- `connection-adapters/mysql/type-metadata.ts` (`connection_adapters/mysql/type_metadata.rb`) — 1: toJSON
- `connection-adapters/postgresql/column.ts` (`connection_adapters/postgresql/column.rb`) — 1: type
- `connection-adapters/postgresql/oid/date-time.ts` (`connection_adapters/postgresql/oid/date_time.rb`) — 1: serialize
- `connection-adapters/postgresql/oid/date.ts` (`connection_adapters/postgresql/oid/date.rb`) — 1: serialize
- `connection-adapters/postgresql/oid/hstore.ts` (`connection_adapters/postgresql/oid/hstore.rb`) — 1: isChanged
- `connection-adapters/postgresql/oid/money.ts` (`connection_adapters/postgresql/oid/money.rb`) — 1: constructor
- `connection-adapters/postgresql/oid/uuid.ts` (`connection_adapters/postgresql/oid/uuid.rb`) — 1: deserialize
- `connection-adapters/postgresql/oid/xml.ts` (`connection_adapters/postgresql/oid/xml.rb`) — 1: value
- `connection-adapters/postgresql/schema-creation.ts` (`connection_adapters/postgresql/schema_creation.rb`) — 1: constructor
- `connection-adapters/postgresql/schema-definitions.ts` (`connection_adapters/postgresql/schema_definitions.rb`) — 1: PostgreSQL
- `connection-adapters/postgresql/type-metadata.ts` (`connection_adapters/postgresql/type_metadata.rb`) — 1: toJSON

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

`pnpm parity:api:extra --package activerecord` must show no row for any of the 57 names
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
