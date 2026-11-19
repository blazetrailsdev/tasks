---
title: "Reflection and association builder parameters typed"
status: claimed
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-activerecord
packages: [activerecord]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: "2026-11-19T00:36:53Z"
assignee: "class-expression-lint-misses-namespace-import-esbuild-collision"
blocked-by: null
closed-reason: null
---

## Context

`reflection.ts` (71), `associations/builder/association.ts` (27),
`associations/builder/belongs-to.ts` (24) and `autosave-association.ts` (29)
pass `reflection: any` / `model: any` / `record: any` (30, 23 and 66 such
parameters across `lib/`). The reflection classes exist
(`AssociationReflection`, `ThroughReflection`, ...); the parameters just do
not name them.

## Acceptance criteria

- [ ] Hits in the files above fall from 151 to ≤ 61 (at least 60%).
- [ ] Each `reflection: any` names the reflection class Rails passes there,
      a union where Rails accepts several.
- [ ] No discriminated-union refactor of reflection (RFC 0009 W4 is out of
      scope).

## Verification

Count hits from `packages/activerecord/lib`, before and after, and record both in
the PR body:

```sh
grep -Po ': any|as any|as unknown as' reflection.ts associations/builder/association.ts associations/builder/belongs-to.ts autosave-association.ts | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
