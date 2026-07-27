---
rfc: "0080-api-compare-jsdoc-metadata"
title: "api-compare JSDoc metadata: one tag family for calls parity and extra surface"
status: active
created: 2026-07-26
updated: 2026-07-27
owner: "@your-handle"
packages:
  - "activerecord"
  - "abstractcontroller"
  - "globalid"
  - "arel"
clusters:
  - "api-compare"
priority: 2
---

# api-compare JSDoc metadata — one tag family for calls parity and extra surface

## Summary

Move api-compare's method-level curation out of side-channel JSON baselines
and into **inline JSDoc tags on the methods themselves**, as one coherent tag
family with a shared grammar:

- **`@missingRailsCall <ruby_call> — <reason>`** — a Rails call this method's
  body is known to omit. Designed and prototyped in trails PR
  [#5229](https://github.com/blazetrailsdev/trails/pull/5229)
  (`docs/infrastructure/api-build-stub-generation-plan.md`, `api:build`).
  That PR is in flight and owned by another agent; this RFC is the umbrella
  tracking home for that work — it does not redesign it.
- **`@noRailsEquivalent <reason>`** — NEW, designed here: marks a TS
  method/function/getter as **justified extra surface** — a documented,
  converged deviation with no Rails counterpart. It replaces both
  `scripts/api-compare/extra-surface-allow.json` and the hand-maintained
  in-file allow machinery in `scripts/api-compare/extra-surface.ts` as the
  single source of truth for justified novel extras.

The two tags are siblings: same placement (leading JSDoc on the declaration),
same reason convention (free prose after the tag, em-dash-separated where a
key token precedes it, continuation lines attach), same parser toolchain
(`ts.getJSDocTags` in `extract-ts-api.ts` — the `@internal` handling and
PR #5229's `parseJsdoc` are the precedents), same TypeDoc suppression (both
registered as excluded block tags so neither renders on the docs site).

## Why fold these together

Both efforts answer the same question — "this method diverges from Rails; is
that known, and why?" — for two different gates (`api:calls`/`api:calls:wide`
missing-call ratchets vs the `api:extra` extra-surface report). Today the
answer lives in three JSON baselines plus in-file constant sets, none of them
visible at the method an agent is editing. Two rival tag designs would mean
two grammars, two parsers, and two migration campaigns; one family means an
agent learns one convention and the extractor grows one tag-reading pass.

## Tag name: why `@noRailsEquivalent`

Candidates considered: `@trailsExtra`, `@trailsOnly`, `@noRailsEquivalent`,
`@missingApiCall`.

- `@missingApiCall` — rejected: near-collision with `@missingRailsCall`, and
  wrong semantics (nothing is missing; something extra exists).
- `@trailsExtra` / `@trailsOnly` — rejected: they label the method but don't
  state the _claim_ being made, and they don't read as siblings of
  `@missingRailsCall`, which names Rails and states a fact about the Rails
  relationship.
- **`@noRailsEquivalent`** — chosen: it states exactly what the
  extra-surface classifier verified (no Ruby method anywhere in Rails-land
  produces this name — the "novel" classification), it reads as a factual
  sibling of `@missingRailsCall`, and it is self-documenting at the call
  site: the next reader learns the deviation claim before the reason prose.

## Semantics — `@noRailsEquivalent` vs `@internal`

These are **different claims** and the design keeps them distinct:

- **`@internal`** (existing, CONTRIBUTING.md): "this is not API surface at
  all." A Rails-private helper or a trails wiring seam. The extractor sets
  `internal: true`; the method is **removed** from the compared TS surface
  entirely (and from the TypeDoc site via `excludeInternal`). Use it when the
  method should never be counted.
- **`@noRailsEquivalent`** (new): "this IS public API surface, deliberately,
  and Rails has no counterpart." The method **stays counted and visible** in
  `api:extra` — it is reported in the `Allowed` column, not hidden — with an
  inline reason explaining the justified deviation. Use it for deliberate
  public trails surface (e.g. `registerModel` in
  `activerecord/src/associations.ts` — public by design, "`@internal` would
  be a lie rather than a fix", per its current allow.json reason).

Scope rule, unchanged from today's allowlist policy: the tag applies to
justified **novel** extras only. A **moved** extra (a Rails method ported
into the wrong file) is a misplaced port — relocate it to the Rails-layout
file; do not tag it. The stale-tag gate (below) enforces the boundary
mechanically where it can.

## Mechanism

Extractor (`extract-ts-api.ts`): a new tag-reading pass alongside
`hasInternalJsDocTag` records `noRailsEquivalent: "<reason>"` on `MethodInfo`
for class/module members and top-level `fileFunctions`. Reason = all prose
after the tag including continuation lines (same rule as PR #5229's
`parseJsdoc`). An empty reason is an extraction-time error — mirroring
`findInvalidAllowEntries`'s empty-reason rejection.

Consumer (`extra-surface.ts`): where the script today checks
`allowKeys.has(allowKeyOf(...))`, it instead (during migration: additionally)
checks the manifest's `noRailsEquivalent` field. Tagged extras count as
`allowlisted` exactly as JSON-allowed extras do today — subtracted from
novel/moved, reported in the `Allowed` totals (these outputs feed the stats
DB; the report shape must not change).

Stale-tag gate, preserving today's only-shrink semantics: a tag on a method
that does **not** flag as extra surface (Rails gained the method, the file
mapping changed, or the method was mis-tagged as a cover for a moved extra)
fails the run, exactly as stale JSON entries do today. The fix is deleting
the tag next to the code.

Structural advantage over the JSON (same as PR #5229 notes for its tag): the
justification travels with the declaration on renames/moves — no
`package + tsFile + name` key to go stale for path reasons.

## What is replaced vs what stays

Replaced (migrated to inline tags, then retired):

- `extra-surface-allow.json` — all 27 entries (abstractcontroller 14,
  globalid 11, activerecord 2), each reason preserved verbatim as tag prose.
- The trails-only ergonomic finders injected via
  `AMBIENT_RAILTIE_MIXINS["ActiveRecord::Base"].methods`
  (`find_global_id`, `find_signed_global_id[!]`) — these are genuinely
  trails-only surface; the tag moves the justification onto their TS
  declarations.
- `TS_ALWAYS_ALLOWED` — dissolved by audit (see the audit story): names that
  are genuinely trails/JS-only surface at specific declarations (`catch`,
  `finally`, `[Symbol.iterator]`, `[Symbol.asyncIterator]`, the Node inspect
  hook) become per-declaration tags; names that mirror real Ruby methods on
  `conventions.SKIP` (`freeze`, `inspect`, `dup`, …) are NOT extras at all —
  they belong in the candidate-name mapping (`rubyMethodCandidates` /
  conventions), not in a tag, because tagging them `@noRailsEquivalent`
  would be false.

Stays (not per-method justifications — they correct Ruby-side extraction
blind spots, i.e. they add to the _allowed_ set rather than excuse a TS
extra):

- `AMBIENT_RAILTIE_MIXINS` `includes` (railtie-injected mixins).
- `PORTED_UNPORTED_MIXIN_METHODS` (methods with REAL Rails counterparts
  whose mixin source file is on `UNPORTED_FILES`). Tagging these
  `@noRailsEquivalent` would be a lie — Rails defines them.

## Rollout order

1. Extractor + `extra-surface.ts` support (tag honored alongside JSON;
   stale-tag gate).
2. Per-package migrations, each within the 500-LOC ceiling:
   abstractcontroller, globalid, activerecord (+ ambient finder methods).
3. Retire `extra-surface-allow.json` (delete file, loader, validation; tags
   are the only source).
4. `TS_ALWAYS_ALLOWED` audit + dissolution.
5. After PR #5229 merges: fold an "extra-surface sibling tag" section into
   `docs/infrastructure/api-build-stub-generation-plan.md` and register both
   tags in the TypeDoc/lint tag config together. (Do NOT touch that doc
   before merge — the branch is owned by another agent.)

## Non-goals

- No change to `@missingRailsCall` / `api:build` design — PR #5229 owns it.
- No change to the `@internal` convention.
- No new gate: `api:extra` keeps its current exit-code behavior (invalid
  justifications and stale entries fail; the report itself stays advisory)
  and its JSON report shape (stats-DB consumer).
