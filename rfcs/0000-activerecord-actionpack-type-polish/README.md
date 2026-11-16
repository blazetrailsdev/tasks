---
rfc: "0000-activerecord-actionpack-type-polish"
title: "Type polish for activerecord and actionpack"
status: draft
created: 2026-11-16
updated: 2026-11-16
owner: "@deanmarano"
packages:
  - "activerecord"
  - "actionpack"
clusters:
  - type-polish-gates
  - type-polish-activerecord
  - type-polish-actionpack
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Type polish for activerecord and actionpack

## Summary

activerecord and actionpack are the two packages a trails app touches most,
and their types still carry escape hatches: `any` in signatures, `as any`
casts, and `as unknown as` double casts onto mixin host interfaces. This RFC
burns those down in `lib/`, adds a ratchet for the double cast that no gate
counts today, and gives actionpack the type-level DX tests activerecord
already has. The work changes types only, never runtime behaviour or Rails
names.

## Motivation

Counts on trails main `ebd0506762` (2026-11-16), `lib/` only, by
`grep -rPo <pattern> packages/<pkg>/lib --include=*.ts | wc -l`:

| pattern            | activerecord lib (408 files) | actionpack lib (165 files) |
| ------------------ | ---------------------------- | -------------------------- |
| `: any`            | 753                          | 19                         |
| `as any`           | 91                           | 8                          |
| `as unknown as`    | 202                          | 117                        |
| `@ts-expect-error` | 4                            | 0                          |
| `Function` type    | 67                           | 6                          |

The tests carry far more (`as any` 5,885 in activerecord tests), but test
casts are out of scope here (see Non-goals).

**activerecord.** RFC 0009 and RFC 0037 cut `this: any` from 131 to about 5
and put `no-explicit-any` at `warn` with a per-file count ratchet
(`pnpm parity:lint:counts`). What is left is concentrated: the
`: any` parameters are mostly `args: any` (75), `record: any` (66),
`reflection: any` (30), `relation: any` (29), `this: any` (25),
`model: any` (23) and `klass: any` (20), and fifteen files hold over half of
all hits, led by `relation/query-methods.ts` (109), `reflection.ts` (54),
`relation.ts` (37), `core.ts` (37) and `relation/finder-methods.ts` (33).
Each `record: any` / `relation: any` is a hole in the published `.d.ts`: a
user calling the method gets no completion and no error.

**actionpack.** `no-explicit-any` is already clean in practice. The debt is
`as unknown as`: 117 casts, most of them onto a mixin's host interface
(`Record` 11, `PolymorphicHost` 7, `UrlForHost` 5, `CachingClassMethods` 4,
`RackishResponse`, `FlashRequestHost`, `CookieJar`, `ConfigReceiver` 3
each). `routing/route-set.ts` alone holds 22. A double cast is an
unchecked claim, so a renamed host member compiles and fails at run time.
No gate counts `as unknown as` in either package, so this debt can grow
silently.

actionpack also has no type-level tests. activerecord's
`packages/activerecord/dx-tests/*.test-d.ts` (11 files, CI job
`DX Type Tests`) check what a user sees; nothing checks a controller's
`params`, `render`, or a route set's url helpers.

## Design

### 1. Ratchet first

Extend `pnpm parity:lint:counts` (`scripts/parity/eslint-count.ts`) to count
`as unknown as` per file in `packages/activerecord/lib` and
`packages/actionpack/lib`, only-shrink against `origin/main` like the
`no-explicit-any` count. Put actionpack `lib/` under the same
`no-explicit-any` count and the `no-explicit-any-disable` error rule that
activerecord and arel already use. Every later story then lands as a
measured decrease.

### 2. The replacement for each escape hatch

Each story uses one of these, in this order:

1. **The real type.** `record: any` becomes `Base`, `relation: any` becomes
   `Relation<T>`, `reflection: any` becomes the reflection class Rails passes.
2. **A host interface on `this`**, per CLAUDE.md § "Module mixins": a
   `this`-typed function or `Included<>` / `Extended<>` instead of casting
   `this` to the host.
3. **`unknown` plus a narrowing guard** where the value really is open
   (a user-supplied option, a `*args` splat).
4. **A generic** where the Rails method returns what it was given.

A cast that stays (a cross-package boundary the language cannot express)
moves to a single typed helper or keeps its site, with a `@noRailsEquivalent`
receipt only where it adds a name. No story renames a Rails method, parameter
or local, reorders control flow, or adds a wrapper to dodge a cast.

### 3. actionpack DX tests

Add `packages/actionpack/dx-tests/` on activerecord's model: `*.test-d.ts`
files run by `pnpm test:types` and the existing `DX Type Tests` CI job.
First coverage: `ActionController::Parameters` (`require` / `permit` /
`fetch`), `render` options, `redirect_to`, `before_action` callbacks, and
`url_for` / named route helpers on a drawn route set.

## Non-goals

- **Test-file casts.** activerecord tests hold 5,885 `as any`; they are
  RFC 0037's `burndown-tests-allowlist` territory and do not reach users.
- **Other packages.** activesupport, activemodel and actionview are
  separate RFCs if wanted.
- **The reflection discriminated union.** RFC 0009's W4 refactor stays its
  own decision; this RFC types reflection parameters with the existing
  classes only.
- **Runtime changes.** A story that needs a behaviour change to type a
  value files that change as its own story.

## Alternatives considered

- **One codemod pass.** RFC 0037's `strip-asany-codemod` removed the
  mechanical casts already; what remains needs a reader per site.
- **Turning `no-explicit-any` to `error` now.** It would need an allowlist
  of every current site, which is the per-file count we already have.

## Rollout

1. Gates — `type-polish-count-double-casts`.
2. activerecord, in parallel — `ar-types-relation-query-methods`,
   `ar-types-relation-finders-and-calculations`,
   `ar-types-reflection-and-association-builders`,
   `ar-types-core-persistence-scoping`.
3. actionpack, in parallel — `actionpack-dx-type-tests`,
   `actionpack-route-set-and-url-for-host-casts`,
   `actionpack-controller-mixin-host-casts`.

## Verification

On close, `lib/` only:

- activerecord `: any` ≤ 375 (half) and `as any` ≤ 30.
- activerecord `as unknown as` ≤ 140; actionpack `as unknown as` ≤ 40.
- `packages/actionpack/dx-tests/` exists with at least 5 `*.test-d.ts`
  files, green in `DX Type Tests`.
- `pnpm parity:api` / `parity:test` deltas non-negative in every PR.

## Open questions

1. **Should the double-cast count also cover test files?** Recommendation:
   no, `lib/` only, matching the scope above.
2. **Should actionpack DX tests share activerecord's dx-tests tsconfig or
   own one?** Recommendation: own one, so each package's job can be
   filtered.

## Changelog

- 2026-11-16: initial RFC
