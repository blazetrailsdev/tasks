---
title: "Core, persistence, scoping and uniqueness types without any"
status: claimed
updated: 2026-11-18
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-activerecord
packages: [activerecord]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-11-18T22:37:37Z"
assignee: "adapter-load-path-pulls-only-the-configured-driver"
blocked-by: null
closed-reason: null
---

## Context

`core.ts` (38), `persistence.ts` (26), `scoping.ts` (23) and
`validations/uniqueness.ts` (19) hold 106 hits, mostly `this: any` /
`klass: any` on class methods mixed onto `Base`.

## Acceptance criteria

- [ ] Hits in the files above fall from 106 to ≤ 43 (at least 60%).
- [ ] `this: any` on a mixed-in class method becomes a `this`-typed host
      (`typeof Base` or the module's host interface), per CLAUDE.md
      § "Module mixins".
- [ ] `create` / `update` / `destroy` / `reload` keep the subclass type
      when called on a model (dx-test in `basic-crud.test-d.ts`).

## Verification

Count hits from `packages/activerecord/lib`, before and after, and record both in
the PR body:

```sh
grep -Po ': any|as any|as unknown as' core.ts persistence.ts scoping.ts validations/uniqueness.ts | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
