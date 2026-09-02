---
title: "Burn the 19-name ambiguous-parent remainder to zero"
status: draft
updated: 2026-09-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7395 (RFC 0126, `resolve-parent-ambiguity-drops-48-inheritance-edges`) took
the ambiguous-parent population from 56 names to 19 and gated the remainder
only-shrink. This story burns the remainder to zero.

`resolveEntityByDeclaringFile` (`scripts/api-compare/compare.ts:3040-3090`)
follows an inheritance edge to NOTHING when several same-named candidates all
share zero leading path segments with the child. The edge's parent methods then
never pool under the child's file key, which is what `directMatch` consults, so
a Ruby method trails really does answer through inheritance reads as missing.

PR #7395 fixed the two cases the extractor could classify: a symbol resolving to
another workspace package now records `pkg:<package>:<path>` and one resolving
outside the workspace records `external:`
(`declaringFile`, `scripts/api-compare/extract-ts-api.ts:277-306`; the sentinels
live in `scripts/parity/types.ts`).

The committed remainder is `scripts/api-compare/ambiguous-parent-mark.json`:

```json
{ "actiondispatch": 3, "activemodel": 1, "activerecord": 14, "rack": 1 }
```

- activerecord (14): AttributeRegistration, Base, Calculations, Callbacks,
  ClassMethods, DatabaseStatements, Dirty, InstanceMethods, JSON, Query,
  QueryCache, Quoting, SchemaStatements, Serialization
- actiondispatch (3): Helpers, Request, ToJsonWithActiveSupportEncoder
- activemodel (1): API
- rack (1): Helpers

These are the names the checker hands back no declaration site for at all —
`declaringFile` returns undefined rather than either sentinel. Two known
sources, both documented in CLAUDE.md:

- a **mixin-factory call** — the edge is `include(X, someFactory(...))` rather
  than a plain identifier, so there is no symbol to resolve;
- a **zero-import slot** — `activerecord/src/base-slot.ts` and friends export a
  mutable binding set at runtime, so `Base` has no static declaration the
  checker can attribute (CLAUDE.md, "Call-time constant resolution").

## Converged shape

Extend `declaringFile` (or its callers in `extractClass` / `extractInterface`)
to record a declaring file for those two shapes:

- mixin-factory call: resolve the FACTORY's declaration site, the way
  `recordExtendsFile` (`extract-ts-api.ts:260-269`) already does for a plain
  `include()`/`extend()` argument;
- slot binding: resolve through the slot module's `_setX()` caller — the
  defining module is a static fact even though the binding is not.

Burn `ambiguous-parent-mark.json` down with `pnpm parity:api:parents:tighten`
(writes DOWN only; there is no reseed) as each source is closed. The gate
(`scripts/api-compare/lint-ambiguous-parents.ts`, wired into the
`rails-comparison` CI job) fails on any increase, so the population cannot grow
back while this is worked.

## Acceptance criteria

- [ ] `pnpm parity:api` reports zero ambiguous parent names, or a remainder
      whose every entry is a documented TypeScript shortcoming.
- [ ] `ambiguous-parent-mark.json` tightened to the new measurement; never
      raised.
- [ ] Report the per-package `inheritance: N/M` and matched/missing delta. A
      RISE is the expected shape (edges that were dropped now pooling); spot-check
      each newly matched pair against `vendor/rails` to confirm trails really does
      answer it through that parent.
