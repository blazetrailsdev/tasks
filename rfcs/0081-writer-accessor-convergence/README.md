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
