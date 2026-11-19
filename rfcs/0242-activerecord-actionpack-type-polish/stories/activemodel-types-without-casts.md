---
title: "activemodel lib without double casts"
status: done
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-neighbours
packages: [activemodel]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 350
priority: null
pr: trails#10335
claim: "2026-11-19T01:51:33Z"
assignee: "activemodel-types-without-casts"
blocked-by: null
closed-reason: null
---

## Context

activemodel `lib/` has 42 `as unknown as` and 8 `any`. `secure-password.ts`
holds 14; the rest are casts to `Record` (12), `RecordWithRawAttribute`,
`HostAsClass` and `ValidationsContextHost` in `conversion.ts`,
`attribute-registration.ts`, `naming.ts`, `validations.ts` and
`validations/numericality.ts`.

## Acceptance criteria

- [ ] activemodel `lib/` `as unknown as` ≤ 15 and `any` ≤ 2.
- [ ] Host casts become `this`-typed functions or `Included<>` per
      CLAUDE.md § "Module mixins".
- [ ] `hasSecurePassword` adds typed `password` / `authenticate` members
      without a cast at the call site.

## Verification

Count hits from `packages/activemodel/lib`, before and after, and record both in
the PR body:

```sh
grep -Po ': any|as any|as unknown as' -r --include=*.ts . | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
