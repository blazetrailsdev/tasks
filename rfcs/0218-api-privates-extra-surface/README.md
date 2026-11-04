---
rfc: "0218-api-privates-extra-surface"
title: "api privates extra: score internal TS declarations against Rails-private methods"
status: active
created: 2026-11-03
updated: 2026-11-04
owner: "@deanmarano"
packages: []
clusters:
  - api-compare
---

# RFC 0218 — api privates extra: score internal TS declarations against Rails-private methods

## Summary

`parity:api:extra` scores only PUBLIC TS names against Ruby. Every internal
declaration — TS `private` / `protected`, a `#` field, an `@internal` JSDoc
tag, a module-private file-local helper — is only tallied in the `Intrnl`
column, and `_`-prefixed names are not even tallied. So an invented private
helper, which `CLAUDE.md § "Fidelity is the job"` forbids exactly as it
forbids an invented public one ("If Rails extracts a private helper, extract
it, with the Rails name … Do not add a helper … that Rails does not have"), is
measured by nothing. This RFC adds a second lane, `pnpm parity:api:privates`,
that scores every internal TS declaration against the Ruby private/protected
methods of its mirrored `.rb` file. The first wave is report-only; an
only-shrink ratchet is filed and deferred until the report's numbers exist.

## Motivation

Where the current tooling stops (trails `main` at `8d2d2ae207`):

- `scripts/api-compare/extra-surface.ts:28-34` (algorithm step 3) filters out
  every `internal: true` declaration and, separately, every `_`-prefixed name
  before scoring. `walkTsFileSurface` applies the `_` filter at `:1176`,
  `:1183` and `:1212`.
- `countTsInternalNames` (`extra-surface.ts:1218-1245`) is the only place
  internal names are seen, and it only counts them; `:1231` and `:1237` skip
  `_` names even there. RFC 0120's `report-and-ratchet-internal-counts`
  (trails#9109) built this count to make a `@noRailsEquivalent` → `@internal`
  swap visible, and its own Notes say the count is "not a moral judgement".
  It never asks whether the internal name exists in Rails.
- The Ruby side of the public lane allows Ruby private/protected names on
  purpose (`extra-surface.ts:1709-1712`): a public port of a Rails-private
  method is a "visibility divergence", not extra. Nothing reports the
  divergence in either direction.
- `extractFileLocalHelpers` (`scripts/api-compare/extract-ts-api.ts:4608-4680`)
  already records every module-private `function` / arrow `const` as a
  `visibility: "private", internal: true` MethodInfo, and its JSDoc
  (`:2774-2784`) says it exists so "`--privates` mode picks them up". The
  `--privates-only` mode of `compare.ts` (`:3365`, `methodInMode` at
  `:3371-3375`) is Ruby → TS only (what Rails-private is missing in TS); there
  is no TS → Ruby direction.
- The class / member extractor already carries visibility:
  `extract-ts-api.ts:1125-1130` and `:4858` set `visibility` from a
  `PrivateIdentifier` / `private` / `protected` modifier and `internal` from it
  or from `internalJsDocTagApplies`.
- `eslint/rails-private-methods.json` (built by
  `scripts/build-rails-privates-manifest.ts` from `rails-api.json`) already
  projects "private on every contributor" Ruby names onto TS files, per file,
  per entity and per instance half. RFC 0121's
  `blazetrails/rails-private-jsdoc` and `unbacked-internal-needs-receipt` use
  it to police the `@internal` TAG; neither scores the NAME.
- A receipt on an internal member is rejected today: RFC 0025's draft story
  `allow-no-rails-equivalent-tags-on-private-members` records that tagging
  `relation.ts`'s `_loadAsyncPromise`, `_asyncLoad`, `_loadToken` reddened the
  STALE check, because the public lane never counts them. There is no lane in
  which such a receipt is meaningful.

`CLAUDE.md § "Speed"` adds a constraint this RFC must honour: "`@perf`
exempts nothing … does not take a declaration out of the `internal` or
extra-surface counts … what keeps a perf helper out of that count is the `_`
prefix `countTsInternalNames` skips". Scoring `_` names makes that prefix stop
hiding the helper, so the RFC has to say what a `@perf` `_` helper scores as.

## Design

### Population

A TS declaration is in the privates population iff it is in a Rails-matched
(or uncovered, RFC 0080 step 4b) TS file, is not `declaredIn` another file,
and any of:

1. it carries a TS `private` / `protected` modifier, or is a `#` identifier;
2. it carries `@internal` (as `internalJsDocTagApplies` reads it, so a
   `@noRailsEquivalent` beside it already moves it to the public lane, RFC
   0121 — it is NOT double-scored here);
3. it is a module-private file-local helper from `extractFileLocalHelpers`
   (a bodyless `aliasOf` row scores through its target, not twice);
4. its name starts with `_`, whatever its visibility — the set
   `walkTsFileSurface` and `countTsInternalNames` skip today.

Interface members, synthesized mixin names and `NotImplementedError` stubs are
held out exactly as the public lane holds them out. Constants in
`tsInternalConstants` are in the population; module-private non-function
`const`s are not (the extractor does not record them, and adding them is a
non-goal).

### Matching

A privates-population name is **credited** only by a Ruby `private` /
`protected` method of an entity in the mirrored `.rb` file (own or `include`d,
as `collectAllowedNames` gathers them), mapped through the same
`scripts/parity/conventions.ts` machinery the public lane uses:
`rubyMethodCandidates`, `scopedSkipMirrorName`, `operatorSpelling`. For a `_`
name the leading `_` is stripped once before matching (RFC 0106's
`add-leading-underscore-call-candidate-to-conventions` is the same rule on the
call side), and a Ruby name's own leading `_` is preserved as conventions
already does. No new spelling table is added.

Each population name lands in exactly one column:

| Column       | Meaning                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `credited`   | a Ruby private/protected method in the mirrored `.rb` matches              |
| `visibility` | only a Ruby PUBLIC method in the mirrored `.rb` matches                    |
| `moved`      | no match in the mirrored `.rb`, a Ruby method elsewhere in the gem matches |
| `novel`      | no Ruby method anywhere in the gem matches                                 |
| `allowed`    | a `@noRailsEquivalent PERMANENT/CONVERGEABLE` receipt covers it            |

**Visibility mismatch is its own column**, not folded into `novel`. Its
remedy is different (make the member public and let the public lane score it,
or ratify why it is private) and it is ported surface, not invented surface;
mixing the two would make the `novel` burndown un-actionable. The column is
the mirror image of the public lane's deliberate allowance at
`extra-surface.ts:1709-1712`, which stays as it is: a public TS port of a
Rails-private method is reported by `rails-private-jsdoc`, not here.

### Receipts

A `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` receipt on a
population declaration moves it from `novel` / `moved` / `visibility` to
`allowed`, as in the public lane. A receipt on a population name that would
otherwise be `credited` is STALE in this lane. Because `internalJsDocTagApplies`
already lets a receipt override a JSDoc `@internal` (RFC 0121), the only
receipts that reach this lane are those on a real `private` / `protected` /
`#` member, a file-local helper, or a `_` name — exactly the shapes the public
lane calls STALE today. The public lane's STALE check stops counting those
shapes as stale once this lane reads them (that is the fix the RFC 0025
`allow-no-rails-equivalent-tags-on-private-members` story asks for).

### `@perf` helpers

A `_` helper carrying `@perf` is scored like any other name: credited if Rails
has the private, otherwise `novel` / `moved`. `@perf` subtracts nothing, as
`CLAUDE.md § "Speed"` says. The report prints a `perf` sub-count of the
`novel` + `moved` rows that carry `@perf`, so a reader can tell a measured
hot-path helper from an unreceipted invention without the tag becoming an
exemption. The first-wave report does not change the `_` skip in
`countTsInternalNames` or the public lane; `CLAUDE.md § "Speed"`'s sentence
about the `_` prefix keeping a perf helper out of "that count" stays true of
the public lane's count.

### Surface

- `pnpm parity:api:privates` (`scripts/api-compare/privates-surface.ts`),
  reading the same `output/{rails,ts}-api.json` the public lane reads, with
  `--package`, `--json` and a top-N text table. No exit code other than for a
  missing manifest or a STALE receipt.
- JSON shape stable for the stats-DB importer: per package and per file,
  every column above plus `perf`.
- No change to `parity:api:extra`'s counted numbers, its mark files or CI in
  wave 1; its STALE check narrows as § Receipts says
  (`privates-surface-receipts-subtract`).

## Non-goals

- **Gating in wave 1:** the report has never been run; a mark seeded from an
  unmeasured lane is a reseed by another name. Deferred to
  `privates-surface-only-shrink-ratchet`.
- **Converging any private surface:** burndown stories are filed per package
  from the baseline numbers, not in this RFC.
- **Changing `@internal`'s meaning or the RFC 0121 lints:** those police the
  tag; this lane scores the name.
- **Module-private non-function constants:** the extractor does not record
  them and they are not methods.
- **Runtime visibility:** trails has none (`CLAUDE.md § "Method visibility is
compile-time only"`); this lane reads TS modifiers and JSDoc only.

## Alternatives considered

- **Fold internal names into `parity:api:extra` as more rows:** it would
  inflate every gated package's `novel` / `total` overnight and red
  `parity:api:extra:gate` everywhere, and the public lane deliberately credits
  Ruby privates as allowed, which the privates lane must not.
- **Credit a TS private by any Ruby method of the file:** that is the public
  lane's rule, and it hides the visibility mismatch the owner asked for.
- **Make `@perf` subtract like a receipt:** `CLAUDE.md § "Speed"` rules it out.
- **Score against `eslint/rails-private-methods.json` directly:** that
  manifest keeps only names private on EVERY contributor and is keyed by TS
  spelling, so a name private on one entity and public on a sibling would read
  as `novel`. Matching on `rails-api.json` with `collectAllowedNames`'s entity
  walk is the same source with the per-entity visibility intact.

## Rollout

1. Report — `privates-surface-report`, then
   `privates-surface-visibility-column`,
   `privates-surface-file-local-and-perf-helpers` and
   `privates-surface-receipts-subtract` (each on the report).
2. Measure — `privates-surface-baseline-counts`: run on `main`, record the
   per-package table in this README, propose per-package burndown stories.
3. Gate (deferred) — `privates-surface-only-shrink-ratchet`, after the
   baseline is reviewed.

## Verification

- `pnpm parity:api:privates --json` reports every package `parity:api:extra`
  reports, with the five columns plus `perf`.
- A cross-check test, owned by `privates-surface-file-local-and-perf-helpers`,
  pins `Intrnl = population − (_-prefixed rows) + (aliasOf rows)` over the
  files `extra-surface.ts:2638` does not skip as path-mirror folds.
  File-local helpers are in both counts (`extract-ts-api.ts:1086-1088` puts
  them in `fileFunctions`); `countTsInternalNames` counts an `aliasOf` row,
  which this lane scores through its target instead. A JSDoc-`@internal`
  declaration with a receipt is in neither count (RFC 0121 clears its
  `internal` flag), so it needs no term.
- The three `relation.ts` members from RFC 0025's story can carry a receipt
  without reddening either lane.
- Wave 2: the README holds a dated baseline table per package.

## Open questions

- Is `moved` worth its own column in wave 1, or should a name with no match in
  the mirrored `.rb` be `novel` regardless, as the first cut? (Proposed: keep
  it; the public lane's `moved` / `novel` split proved actionable in RFC 0117.)
- Should a `protected` TS member mirroring a Ruby `private` one (or the
  reverse) be `credited` or `visibility`? (Proposed: `credited`; Ruby's
  private/protected distinction does not survive into TS the same way.)
- Does RFC 0025's `allow-no-rails-equivalent-tags-on-private-members` close
  when `privates-surface-receipts-subtract` lands, or get a `deps` edge onto
  it? (Proposed: a `deps` edge, set by `tasks set-deps` after this merges.)

## Changelog

- 2026-11-03: initial RFC
