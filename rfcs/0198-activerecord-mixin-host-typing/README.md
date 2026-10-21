---
rfc: "0198-activerecord-mixin-host-typing"
title: "ActiveRecord mixin-host typing: derived interfaces replace loose any and casts"
status: active
created: 2026-10-19
updated: 2026-10-19
owner: "@deanmarano"
packages:
  - activerecord
  - "activemodel"
  - "activesupport"
clusters:
  - cast-ratchet
  - mixin-host-typing
  - test-model-typing
priority: 3
---

# RFC 0198 — ActiveRecord mixin-host typing

## Summary

`packages/activerecord/src` (non-test) still carries **1371 matching lines**
of `this: any`, `(this as any|unknown`, `as any` and `as unknown as`
(single regex, `grep -c`, trails main `0996faab65`, 2026-10-19). Grepped
separately the patterns give 416 / 336 / 614 / 375 lines; they overlap, so
those sum to 1741, above the true total. Most
of them sit on module functions mixed into `Base` / `Relation` / reflections,
where the host's type was never written down. This RFC replaces them with host
types **derived from the modules themselves** and adds an only-shrink
per-file count ratchet so the number cannot climb back. It is typing only:
no runtime mechanism changes and no method moves.

## Motivation

Reproduce the count with:

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' \
  --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

Hottest source files: `reflection.ts` 50, `persistence.ts` 50,
`relation.ts` 44, `core.ts` 40, `model-schema.ts` 35, `base.ts` 32,
`attribute-methods.ts` 32, `associations/collection-association.ts` 27,
`relation/query-methods.ts` 26,
`connection-adapters/abstract/database-statements.ts` 25. About 400
occurrences are in `src/test-helpers/models/` (`post.ts` 66, `author.ts` 64,
`developer.ts` 49, `company.ts` 35, `topic.ts` 31).

The cost is real: a `this: any` module function type-checks any body, so a
renamed or retyped `Base` member breaks at run time instead of at compile
time, and a call gate cannot help because the call is still made.

Nothing ratchets this today. RFC 0037 (closed) made `no-explicit-any` an
`error` with a per-file allowlist (`eslint/no-explicit-any-src-exclude.json`,
206 activerecord src files), but that allowlist is binary per file: a listed
file can gain any number of casts, and `as unknown as` is not `any` at all.
RFC 0009 (closed) drove the first waves (`this: any` 131 → ~5 in its scope)
and is the precedent for the "irreducible tail" stance below.

## Design

### Mechanism stays

`include()` / `extend()` and the plain-object and class modules of RFC 0197
remain the runtime mechanism. Every change in this RFC is a compile-time
type. No method relocates: code stays in its Rails-mirroring file
(CLAUDE.md, "Module mixins").

### Host types are derived, not copied

Replace `this: any` on a module function with, in order of preference:

1. a type derived from the module — `Included<typeof Mod>`,
   `Extended<typeof Mod>` (`ruby-compat/src/include.ts`), or a
   declaration-merged `interface Klass` the module already feeds;
2. a narrow host interface naming only what the body reads, in the style of
   activemodel's `AttributeMethodHost` (`activemodel/src/attribute-methods.ts`).

A hand-copied signature list that repeats `Base`'s members is not acceptable:
it drifts silently, which is the problem being fixed.

`(this as any)` / `as unknown as` casts at call sites go the same way: the
cast disappears once the receiver's derived type is available. A cast that
crosses a genuine boundary (a driver row, a cross-package internal) may stay
and is simply counted.

### Extra-surface hazard

Members declared on a merged interface, and every member pulled in by
`interface X extends Y`, count in `parity:api:extra`. A host interface is
therefore declared in a way that adds no public name with no Ruby
counterpart: a type alias over `Included<>` / `Extended<>`, an unexported
interface, or an existing merged interface. Every story keeps
`pnpm parity:api:extra:gate` green and widens no baseline or mark.

### The ratchet

A per-file only-shrink mark of the four patterns above over non-test
`packages/activerecord/src`, in the shape of the other parity marks
(`scripts/api-compare/param-name-mark.ts` / `.json`):

- `pnpm parity:types:casts` fails when any file's count exceeds its mark or a
  new file appears with a non-zero count;
- `pnpm parity:types:casts:tighten` writes marks DOWN only; there is no reseed;
- a file at zero drops its row, and a rowless file must stay at zero;
- the mark file is created once by a `--seed` bootstrap that refuses to run
  when a mark file exists, so after it lands the only write path is down.

**Unit of count: matching lines.** A file's count is exactly what
`grep -cE` with the regex in § Motivation reports: a line holding two casts
counts once, and the overlapping patterns (`(this as any` matches two of them)
are never double-counted. The per-pattern figures in § Summary are separate
greps and overlap, so they sum past the true total; the baseline is the
single-regex line total, re-measured when the ratchet seeds. It runs in Preflight.

## Non-goals

- **Driving the count to zero.** Driver boundaries and genuinely dynamic Rails
  shapes keep some casts (RFC 0009's conclusion). The ratchet stops growth; the
  stories set per-cluster targets.
- **Test files.** `*.test.ts` casts are RFC 0037's allowlist territory.
- **Other packages.** activerecord only; another package joins by its own RFC.
- **Runtime or relocation changes.** Out by construction (see Design).

## Alternatives considered

- **Extend RFC 0037's eslint allowlist.** Binary per file and blind to
  `as unknown as`; a count is the right granularity.
- **`@typescript-eslint/no-unsafe-*` rules.** Type-aware lint over the whole
  package is slow and reports downstream symptoms, not the cast site.
- **One hand-written `BaseHost` interface for every module.** Drifts from
  `Base`, and a public one is a large novel extra surface.

## Rollout

1. Cluster stories, in any order, measured with the grep above (no gate):
   `ar-type-persistence-core-base`, `ar-type-reflection`,
   `ar-type-relation-query-methods`, `ar-type-attribute-methods-model-schema`,
   `ar-type-associations`, `ar-type-connection-adapters-abstract`.
2. `ar-type-remaining-src`, the catch-all for every non-test file no cluster
   story names, in any order.
3. `ar-type-test-helper-models`, after `ar-type-associations` (typed
   association readers remove most model-file casts).
4. `ar-cast-count-ratchet` last, seeded once from the remaining counts. A
   per-file mark JSON tightened by parallel stories would conflict on nearly
   every merge, so the gate does not exist during the burndown.

## Verification

- `pnpm parity:types:casts` is green on main and in Preflight.
- The single-regex matching-line total for non-test
  `packages/activerecord/src` falls by at least 40% from its 2026-10-19 value
  (1371 lines at `0996faab65`) when every story is done. The cluster and
  model stories own 917 lines and their targets remove ~493;
  `ar-type-remaining-src` owns the other 454 at 30% (~136): ~629, or 46%.
- `pnpm parity:api:extra:gate` stays green across every story with no mark or
  baseline widened.

## Open questions

1. **Gate name and home.** `parity:types:casts` under `scripts/api-compare/`
   vs a lint rule. Recommendation: a mark script, matching the other ratchets.
   Decided in `ar-cast-count-ratchet`.

## Changelog

- 2026-10-19: initial RFC
- 2026-10-19: count unit fixed to matching lines; catch-all story added;
  RFC target set to 40%; packages set on stories
- 2026-10-19: ratchet moved to the end of the rollout to avoid mark-file merge conflicts
