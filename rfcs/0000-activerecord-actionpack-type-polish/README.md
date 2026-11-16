---
rfc: "0000-activerecord-actionpack-type-polish"
title: "Type polish for activerecord, actionpack and their neighbours"
status: draft
created: 2026-11-16
updated: 2026-11-16
owner: "@deanmarano"
packages:
  - "activerecord"
  - "actionpack"
  - "activesupport"
  - "activemodel"
  - "actionview"
clusters:
  - type-polish-gates
  - type-polish-activerecord
  - type-polish-actionpack
  - type-polish-neighbours
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Type polish for activerecord, actionpack and their neighbours

## Summary

activerecord and actionpack are the two packages a trails app touches most,
and their types still carry escape hatches: `any` in signatures, `as any`
casts, and `as unknown as` double casts onto mixin host interfaces. This RFC
burns those down in `lib/`, and in the three packages whose types flow into
theirs (activesupport, activemodel, actionview), adds a ratchet for the double
cast that no gate counts today, and gives actionpack the type-level DX tests activerecord
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

The neighbours, same measure:

| package       | `: any` + `as any` | `as unknown as` |
| ------------- | ------------------ | --------------- |
| activesupport | 88                 | 83              |
| activemodel   | 8                  | 42              |
| actionview    | 0                  | 51              |

activerecord's model types are built on activemodel's and activesupport's
(`class_attribute`, callbacks, validations), and actionview renders inside an
actionpack controller, so a loose type there reaches the same app author.
Their hot spots: activesupport `class-attribute.ts` (11), `log-subscriber.ts`
(9), `callbacks.ts` / `current-attributes.ts` (8 each), with 19 casts to
`Record`; activemodel `secure-password.ts` (14), 12 casts to `Record`;
actionview `test-case.ts` (15), `helpers/sanitize-helper.ts` (6), casts onto
`SanitizeHelperClass` and `BehaviorClass` (6 each).

Source files are the scope. Test files carry far more (`as any` 5,885 in
activerecord tests) and are out of scope (see Non-goals).

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
`packages/activerecord/dx-tests/*.test-d.ts` (9 files, CI step
`DX type tests`) check what a user sees; nothing checks a controller's
`params`, `render`, or a route set's url helpers.

## Design

### 1. Ratchet first

`pnpm parity:lint:counts` (`scripts/parity/eslint-count.ts`) counts ESLint
violations per file and per rule in its `RULES` list, against `origin/main`.
It cannot count a text pattern, so the gate story adds an ESLint rule,
`blazetrails/no-double-cast`, that reports `x as unknown as T`. The rule is
held at `warn` on the `lib/` of all five packages and added to `RULES`, so it
is only-shrink like the `no-explicit-any` count. The gate story also puts
the four other packages' `lib/` under the same `no-explicit-any` count and the `no-explicit-any-disable` error rule that
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
files. First coverage: `ActionController::Parameters` (`require` / `permit` /
`fetch`), `render` options, `redirect_to`, `before_action` callbacks, and
`url_for` / named route helpers on a drawn route set. It is a new project in
`vitest.dx-tests.config.ts` beside activerecord's, trailties', actionview's
and rack's, with its own `tsconfig.json`, run by the CI `DX type tests` step.

## Non-goals

- **Test-file casts.** activerecord tests hold 5,885 `as any`; they are
  RFC 0037's `burndown-tests-allowlist` territory and do not reach users.
- **Other packages.** rack (176), trailties (153), mail, nokogiri and
  ruby-compat are a later RFC; none is on an app author's daily type path.
- **The reflection discriminated union.** RFC 0009's W4 refactor stays its
  own decision; this RFC types reflection parameters with the existing
  classes only.
- **Module carrier conversions.** Converting a ruby-compat `Module`
  carrier to a plain module is RFC 0197's work. Where a cast sits on a
  carrier that is still blocked (`ActionDispatch::Routing::UrlFor`, see
  `routing-url-for-and-collector-plain-modules`), the story types around the
  carrier and leaves its shape alone.
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
4. Neighbours, in parallel — `activesupport-types-class-level-mixins`,
   `activesupport-types-notifications-and-logging`,
   `activemodel-types-without-casts`, `actionview-types-without-casts`.

## Verification

On close, `lib/` only. Each target is the start count less the sum of its
stories' acceptance criteria, so meeting every story meets the RFC
(activerecord 1,046 − 88 − 97 − 90 − 63 = 708; actionpack 117 − 22 − 51 =
44; activesupport 171 − 26 − 15 = 130). Every count, the RFC's and each
story's, uses the matches command from Motivation, never `grep -c`. "Hits"
is `: any` + `as any` + `as unknown as`.

| package       | start (hits)                | target (hits)                   |
| ------------- | --------------------------- | ------------------------------- |
| activerecord  | 1,046                       | ≤ 710                           |
| actionpack    | 117 `as unknown as`         | ≤ 45 `as unknown as`            |
| activesupport | 171                         | ≤ 130                           |
| activemodel   | 42 `as unknown as`, 8 `any` | ≤ 15 `as unknown as`, ≤ 2 `any` |
| actionview    | 51 `as unknown as`          | ≤ 15 `as unknown as`            |

- `packages/actionpack/dx-tests/` exists with at least 5 `*.test-d.ts`
  files, green in `DX type tests`.
- `pnpm parity:api` / `parity:test` deltas non-negative in every PR.
- The closing story's PR body records every count, re-taken with the
  command in the Motivation section.

## Open questions

None. The dx-tests layout question is answered by the existing
per-package projects in `vitest.dx-tests.config.ts`.

## Changelog

- 2026-11-16: initial RFC
- 2026-11-16: scope is source files only; add activesupport, activemodel and
  actionview
- 2026-11-16: add the `no-double-cast` rule the count needs, story
  verification commands, the `UrlFor` carrier cross-reference, and targets
  that equal the sum of the stories
- 2026-11-16: review fixes: story counts use matches, not lines; per-story
  start counts; actionpack DX story gains Verification and Definition of
  done; gate criteria merged
