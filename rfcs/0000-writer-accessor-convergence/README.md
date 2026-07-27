---
rfc: "0000-writer-accessor-convergence"
title: "Converge Ruby writer (foo=) re-spellings onto accessors"
status: draft
created: 2026-07-27
updated: 2026-07-27
owner: "@your-handle"
packages:
  - "activerecord"
  - "actionpack"
  - "actionview"
  - "activesupport"
  - "rack"
  - "globalid"
clusters:
  - "extra-surface"
  - "api-compare"
---

## Summary

61 exported `setX` functions across the repo are re-spellings of a Ruby writer
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

Only the 61 that map to a Ruby `foo=`. Two neighbouring populations are out of
scope: 6 faithful ports of a real Ruby `set_*` method (correct as-is), and 28
`setX` functions with no Ruby counterpart under either spelling (a separate
audit story — some are genuine trails-only seams, and `setDifference` /
`setIntersection` are not writers at all).

## The three shapes

The work is not uniform. Sizing and risk follow the shape of the reader:

**Shape 1 — the accessor already exists (12).** A `static set x` accessor is
already declared on the host class and delegates to the exported helper (e.g.
`sanitize-helper.ts:296` calls `setFullSanitizer`). The Rails-named writer is
already correct; the exported helper is redundant public surface. Converging
means unexporting the helper and dropping it from the barrel files. No behavior
change.

**Shape 2 — module-level `export let` (22, 21 of them in `ar-config.ts`).** The
reader is a mutable module binding. ESM live bindings are read-only for
importers, so a setter function is currently the ONLY way to mutate them — this
is the one shape with a real constraint behind it. The convergent form is the
one Rails actually uses: a module object with accessors, so the call site reads
`ActiveRecord.maintainTestSchema = x`, mirroring
`ActiveRecord.maintain_test_schema=`. Needs a design decision before conversion.

**Shape 3 — class slot with no accessor yet (27).** Add a real `get x()` /
`set x(v)` pair on the host class, per the documented convention. This is the
shape of the pilot story `converge-cache-store-writer-onto-accessor`
(`setCacheStore`, RFC 0072).

## Non-goals

Renaming the 6 faithful `set_*` ports. Touching async behavior — there is none
to preserve. Fanning a single story across packages: each story below is scoped
to files that can be converged and tested together.
