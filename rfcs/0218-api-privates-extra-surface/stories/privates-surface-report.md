---
title: "Add pnpm parity:api:privates, scoring internal TS declarations against Rails privates"
status: done
updated: 2026-11-04
rfc: "0218-api-privates-extra-surface"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9708
claim: "2026-11-04T12:59:57Z"
assignee: "privates-surface-report"
blocked-by: null
closed-reason: null
---

## Context

The RFC's Design, "Population" and "Matching". `parity:api:extra` drops every
`internal: true` and `_`-prefixed name before scoring
(`scripts/api-compare/extra-surface.ts:28-34`, `walkTsFileSurface` at
`:1176`, `:1183`, `:1212`) and only counts internal names in
`countTsInternalNames` (`:1218-1245`), skipping `_` there too (`:1231`,
`:1237`). The extractor already records visibility and `internal` on members
(`scripts/api-compare/extract-ts-api.ts:1125-1130`, `:4858`) and on
file-local helpers (`extractFileLocalHelpers`, `:4608-4680`). The Ruby-side
gathering to reuse is `collectAllowedNames` (`extra-surface.ts`, the loop at
`:1700-1718`, which today allows Ruby privates and publics alike), with
`rubyMethodCandidates`, `scopedSkipMirrorName` and `operatorSpelling` from
`scripts/parity/conventions.ts`.

## Acceptance criteria

- `scripts/api-compare/privates-surface.ts` and a `parity:api:privates`
  script in the root `package.json`, reading `output/{rails,ts}-api.json`, with
  `--package`, `--json` and a text table.
- The population is the RFC's four kinds (TS `private` / `protected` / `#`,
  `@internal`, file-local helpers, `_`-prefixed names); `declaredIn`,
  synthesized mixin and interface members are held out as the public lane
  holds them out.
- A name is `credited` only by a Ruby private/protected method of the
  mirrored `.rb`; otherwise `moved` (a Ruby method elsewhere in the gem) or
  `novel`. Until `privates-surface-visibility-column` lands, a name whose only
  match in the mirrored `.rb` is a Ruby PUBLIC method counts as `novel`, and
  the report's help text says so. A `_` name is matched with its leading `_` stripped once.
- The public lane's included-module walk drops Ruby `private` methods of an
  included owner (`extra-surface.ts:1816-1823`, inside `collectAllowedNames`
  at `:1648`); the privates lane keeps them, since `include` makes them
  private methods of the includer, with a test.
- The Ruby-side walk is shared with `extra-surface.ts` (one function
  parameterised by visibility), not copied.
- Unit tests in `scripts/api-compare/` cover each population kind and each
  column on fixture manifests.
- This story leaves `parity:api:extra`'s output byte-identical (the receipts
  story later narrows its STALE check, by design).
