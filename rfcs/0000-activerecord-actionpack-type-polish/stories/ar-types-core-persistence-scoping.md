---
title: "Core, persistence, scoping and uniqueness types without any"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-activerecord
packages: [activerecord]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`core.ts` (37), `persistence.ts` (25), `scoping.ts` (23) and
`validations/uniqueness.ts` (15) hold 100 hits, mostly `this: any` /
`klass: any` on class methods mixed onto `Base`.

## Acceptance criteria

- [ ] Combined hits fall by at least 60%.
- [ ] `this: any` on a mixed-in class method becomes a `this`-typed host
      (`typeof Base` or the module's host interface), per CLAUDE.md
      § "Module mixins".
- [ ] `create` / `update` / `destroy` / `reload` keep the subclass type
      when called on a model (dx-test in `basic-crud.test-d.ts`).

## Verification

Before and after counts, recorded in the PR body, from the trails root:
`grep -rPc ': any\b|as any\b|as unknown as' packages/activerecord/lib --include=*.ts`
over the files named above. `pnpm typecheck`, `pnpm parity:lint:counts`,
`pnpm test:types`, `pnpm parity:api` and `pnpm parity:test` are green, with
non-negative parity deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
