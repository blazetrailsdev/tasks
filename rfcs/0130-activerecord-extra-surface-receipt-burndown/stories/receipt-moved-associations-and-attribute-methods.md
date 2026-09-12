---
title: "associations/ and attribute-methods/: receipt or relocate the 75 moved extras"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 360
priority: 4
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
exactly as the `receipt-*` novel-burndown stories were. **This story is the assoc-attr area:
75 names across 27 files.**

Two clusters dominate. The association subclasses declare a `constructor` Ruby's
class does not define at all — it inherits `Association#initialize`
(`activerecord/lib/active_record/associations/association.rb:41-53`) — so each of those is
either a real extra seed step to fold into the ported method or a receipt. And
`association-cache.ts`, `associations/instance-methods.ts` and `attribute-inspection.ts`
have no Rails counterpart file, so every public name in them scores extra by construction;
`association-cache.ts`'s 12 are a Map-shaped surface Ruby gets from a bare Hash
(`association.rb`'s `@association_cache`), which is a file-level tag, not 12 member tags.
`attribute-methods/time-zone-conversion.ts`'s 7 are the `TimeZoneConverter` decorator's
members, defined in Rails on the type ancestors rather than in
`attribute_methods/time_zone_conversion.rb`.

### The population

- `association-cache.ts` _(no Rails counterpart)_ — 12: clear, constructor, delete, entries, forEach, get, keys, proxies, set, size, store, values
- `associations/association-scope.ts` (`associations/association_scope.rb`) — 9: buildScope, constraints, joinForeignKey, joinPrimaryKey, klass, name, reflection, scopeFor, type
- `attribute-methods/time-zone-conversion.ts` (`attribute_methods/time_zone_conversion.rb`) — 7: assertValidValue, isValueConstructedByMassAssignment, map, serialize, serializeCastValue, type, wrap
- `attribute-inspection.ts` _(no Rails counterpart)_ — 6: formatForInspect, inspect, inspectionFilter, InspectionMask, toJSON, toString
- `attribute-methods/serialization.ts` (`attribute_methods/serialization.rb`) — 5: attribute, coder, ColumnSerializer, dump, load
- `associations/collection-proxy.ts` (`associations/collection_proxy.rb`) — 4: load, select, then, toArray
- `associations/builder/has-one.ts` (`associations/builder/has_one.rb`) — 3: build, defineConstructors, defineWriters
- `associations/has-one-through-association.ts` (`associations/has_one_through_association.rb`) — 3: constructor, reset, writer
- `associations/join-dependency/join-part.ts` (`associations/join_dependency/join_part.rb`) — 3: isReadonly, isStrictLoading, tableAlias
- `associations/association.ts` (`associations/association.rb`) — 2: name, reader
- `associations/has-one-association.ts` (`associations/has_one_association.rb`) — 2: constructor, writer
- `associations/instance-methods.ts` _(no Rails counterpart)_ — 2: association, InstanceMethods
- `associations/singular-association.ts` (`associations/singular_association.rb`) — 2: constructor, target
- `attribute-methods.ts` (`attribute_methods.rb`) — 2: inspect, serializableHash
- `association-relation.ts` (`association_relation.rb`) — 1: isNullRelation
- `associations/alias-tracker.ts` (`associations/alias_tracker.rb`) — 1: get
- `associations/belongs-to-association.ts` (`associations/belongs_to_association.rb`) — 1: constructor
- `associations/belongs-to-polymorphic-association.ts` (`associations/belongs_to_polymorphic_association.rb`) — 1: constructor
- `associations/collection-association.ts` (`associations/collection_association.rb`) — 1: constructor
- `associations/disable-joins-association-scope.ts` (`associations/disable_joins_association_scope.rb`) — 1: constructor
- `associations/errors.ts` (`associations/errors.rb`) — 1: association
- `associations/foreign-association.ts` (`associations/foreign_association.rb`) — 1: constructor
- `associations/has-many-association.ts` (`associations/has_many_association.rb`) — 1: constructor
- `associations/nested-error.ts` (`associations/nested_error.rb`) — 1: innerError
- `associations/preloader.ts` (`associations/preloader.rb`) — 1: materialize
- `associations/preloader/through-association.ts` (`associations/preloader/through_association.rb`) — 1: constructor
- `attribute-assignment.ts` (`attribute_assignment.rb`) — 1: InstanceMethods

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

`pnpm parity:api:extra --package activerecord` must show no row for any of the 75 names
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
