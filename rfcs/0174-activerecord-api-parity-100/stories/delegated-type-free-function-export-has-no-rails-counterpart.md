---
title: "activerecord: drop the package-level delegatedType export (a class method in Rails)"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/index.ts:227` exports `delegatedType` as a top-level function. Rails has no such
free function: `delegated_type` is a class method `Base` gets from `extend DelegatedType`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:293`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/delegated_type.rb:231-234`).

Since trails#8333 the function is `this`-typed (`packages/activerecord/src/delegated-type.ts`) and reached as
`Entry.delegatedType("entryable", { types: [...] })`. The package-level export can only be used as
`delegatedType.call(Entry, …)`, and no caller in the repo imports it any more (the two test files that did were
moved onto the class method in that PR).

## Converged shape

Delete the `export { delegatedType }` line from `index.ts`; keep the `DelegatedTypeOptions` type export
(`index.ts:261`).

## Acceptance criteria

- [ ] `index.ts` no longer exports `delegatedType`.
- [ ] `pnpm typecheck` and `pnpm test:types` pass; no doc or guide references the free-function form.
