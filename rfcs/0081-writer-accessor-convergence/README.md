---
rfc: "0081-writer-accessor-convergence"
title: "Converge Ruby writer (foo=) re-spellings onto accessors"
status: active
created: 2026-07-27
updated: 2026-07-27
owner: "@your-handle"
packages:
  - "activerecord"
clusters:
  - "extra-surface"
  - "api-compare"
---

## Summary

33 exported `setX` functions in `activerecord` are re-spellings of a Ruby writer
(`foo=`). `scripts/api-compare/conventions.ts:638` already documents the rule
they break: a Ruby `foo=` maps to the SAME camelCase name as the reader — a TS
setter or assignable property — and `compare.ts:1645` relies on that mapping
(arity is skipped for `foo=` pairs because the name match alone proves the
writer exists). Every `setX` re-spelling therefore reads as extra surface on the
TS side while the Rails writer reads as missing.

None of them needs the prefix for a technical reason: **zero of the 95 exported
`setX` functions in the repo are `async` or return a `Promise`.** They are all
synchronous assignments, so a real accessor is always expressible.

## Scope

Data layer only — `arel` + `activemodel` + `activerecord`, the packages
`compare.ts:2351` sums as the data layer. In practice that is `activerecord`
alone: the sweep found 33 writer re-spellings there and none in `arel` or
`activemodel`.

The same pattern exists in 28 more places outside the data layer (`actionpack`
15, `actionview` 4, `activesupport` 4, `rack` 4, `globalid` 1). Those are
deliberately NOT in this RFC and their stories were closed as out of scope; if
the data-layer conversion proves the shape, they can be picked up later under
their own RFC.

Also out of scope: 6 faithful ports of a real Ruby `set_*` method (correct
as-is), and the `setX` functions with no Ruby counterpart under either spelling
(a separate audit story — some are genuine trails-only seams, and
`setDifference` / `setIntersection` are not writers at all).

## The three shapes

The work is not uniform. Sizing and risk follow the shape of the reader.

**Shape 1 — the accessor already exists (6).** A `static set x` accessor is
already declared on the host class and delegates to the exported helper. The
Rails-named writer is already correct; the exported helper is redundant public
surface. Converging means unexporting it. No behavior change. In `activerecord`:
`inheritance.ts`, `locking/optimistic.ts` (2), `signed-id.ts`, `token-for.ts`
(2).

**Shape 2 — module-level `export let` (22, 21 of them in `ar-config.ts`).** The
reader is a mutable module binding. ESM live bindings are read-only for
importers, so a setter function is currently the ONLY way to mutate them — this
is the one shape with a real constraint behind it. The convergent form is the
one Rails actually uses: a module object with accessors, so the call site reads
`ActiveRecord.maintainTestSchema = x`, mirroring
`ActiveRecord.maintain_test_schema=`. Needs a design decision before conversion.

**Shape 3 — class slot with no accessor yet (5).** Add a real `get x()` /
`set x(v)` pair on the host class, per the documented convention:
`attribute-methods/primary-key.ts` (`setId`), `signed-id.ts`,
`encryption/context.ts`, `log-subscriber.ts`, `type.ts`.

## Precedent

PR #5381 (`converge-base-configurations-onto-the-rails-accessor`, RFC 0072) did
exactly this for `ActiveRecord::Base.configurations` — read it before starting a
shape-3 conversion.

## Non-goals

Renaming the 6 faithful `set_*` ports. Touching async behavior — there is none
to preserve. Any package outside the data layer.

## Decision — shape 2 (module-level config), settled by the pilot

Settled by `module-level-config-accessor-shape` (pilot: `maintainTestSchema`,
`asyncQueryExecutor`, `queues`).

**The shape.** A single exported object literal named `ActiveRecord`, living in
`packages/activerecord/src/ar-config.ts`, with a `get`/`set` accessor pair per
flag over a file-local `let` backing binding:

```ts
let _maintainTestSchema: boolean | null = null;

export const ActiveRecord = {
  get maintainTestSchema(): boolean | null {
    return _maintainTestSchema;
  },
  set maintainTestSchema(value: boolean | null) {
    _maintainTestSchema = value;
  },
};
```

Call sites read and write it exactly as Rails spells it:
`ActiveRecord.maintainTestSchema = cfg.maintainTestSchema`.

**Why an object literal and not a class with static accessors.** Rails declares
these with `singleton_class.attr_accessor` on `module ActiveRecord`
(active_record.rb:283-321). A `class ActiveRecord { static get ... }` would
match api:compare just as well, but it introduces a class Rails does not have
and one that can be instantiated or subclassed. The object literal is the closer
analogue and is the form `include()`-style mixins in this repo already use.

**What happens to the existing `export let` readers.** They are DELETED along
with their `setX` companion, per flag, at conversion time. They are not kept as
deprecated readers:

- Rails has no deprecated alias here, so keeping one is a trails-only surface.
- Keeping the `export let` would fork the storage — the accessor writes the
  file-local backing binding, and an importer holding the old live binding would
  read a value that no longer updates. A silently-stale reader is strictly worse
  than a compile error.
- The breakage is compile-time and total: every internal caller is a TS import
  that fails to resolve, so nothing can be missed.

**Import surface for internal callers.** `import { ActiveRecord } from
"./ar-config.js"` — one import regardless of how many flags a file touches,
replacing the current one-import-per-`setX` list (see `trailtie.ts`). The object
is re-exported from the package index as `ActiveRecord`, so external callers get
`ActiveRecord.maintainTestSchema = true` verbatim from the Rails docs.

**Migration is per-flag, not big-bang.** Flags not yet converted keep their
`export let` + `setX` pair; the two forms coexist in `ar-config.ts` with no
adapter layer between them, because each flag's storage is independent.

**Tooling change this required.** `harvestObjectLiteralMethods`
(`scripts/api-compare/extract-ts-api.ts`) did not read `get`/`set` accessors out
of an object literal, so the accessors would have extracted as nothing at all
and the three flags would have flipped from matched to missing. It now harvests
them the same way class accessors are harvested (reader: 0 params; writer: the
assigned value). Side effect: five previously-invisible object-literal accessors
elsewhere (`actionview` 3, `trailties` 2) now show up in `api:extra`. They are
pre-existing surface the extractor was blind to, not new drift, and `api:extra`
is report-only (nothing in CI gates on it).

**Note on the acceptance criterion about `api:extra`.** The expected "matching
drop" does not materialise and cannot: `ar-config.ts` has no Rails counterpart
file in the api-compare file map, and `extra-surface.ts` only scores TS files
that have one. The `setX` re-spellings there were never counted as extra
surface. The measurable win is in `api:compare` instead — the three flags are
now credited under their Rails names (`maintainTestSchema`) via the direct-match
path rather than under `setMaintainTestSchema` via the umbrella-config setter
fallback, and each reader gains a real arity check (arity-compared pairs
7528 -> 7531, all matching). Remaining shape-2 conversions should be measured
the same way.

## Follow-up conversions (shape 2)

The pilot converted 3 of 23. The remaining 20 in `ar-config.ts` plus
`setQueryTransformers` in `query-transformers.ts` are split across three
stories, batched so each stays under the 500-LOC ceiling:

- `convert-ar-config-accessors-exported-flags` — the 8 flags re-exported from
  the package index.
- `convert-ar-config-accessors-internal-flags` — the 12 flags internal to the
  package.
- `convert-query-transformers-accessor` — `queryTransformers`, which lives
  outside `ar-config.ts`.
