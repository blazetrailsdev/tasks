---
title: "filterAndSortByDetails and requestedDetailsFor sit on Resolver, not FileSystemResolver"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Resolver#filterAndSortByDetails` and `Resolver#requestedDetailsFor`
(`packages/actionview/src/template/resolver.ts`) sit on the base class. In Rails
both live on `FileSystemResolver` and are private:
`filter_and_sort_by_details` is
`vendor/rails/actionview/lib/action_view/template/resolver.rb:172-181`, and
`requested_details_for` has no Rails counterpart at all — Rails inlines it as
`requested_details = key || TemplateDetails::Requested.new(**details)` at
`resolver.rb:128`.

They were raised to `Resolver` in PR #7296 because two resolvers looked like
they needed them. That is no longer true: `FixtureResolver` inherits from
`FileSystemResolver` (`packages/actionview/src/testing/resolvers.ts`) and
`NullResolver` implements `findTemplates` without either. `grep -n
'this.filterAndSortByDetails\|this.requestedDetailsFor'` finds exactly one
caller, `FileSystemResolver#_findAll`.

## Converged shape

- Move `filterAndSortByDetails` to `FileSystemResolver` as a private method
  (`resolver.rb:172-181`).
- Delete `requestedDetailsFor` and inline `key instanceof Requested ? key : new
  Requested(...)` at the head of `FileSystemResolver#_findAll`, the way
  `resolver.rb:128` does.

## Acceptance criteria

- `Resolver` carries neither method; `pnpm parity:api --package actionview`
  does not regress.
- `pnpm vitest run packages/actionview/src` stays green.
