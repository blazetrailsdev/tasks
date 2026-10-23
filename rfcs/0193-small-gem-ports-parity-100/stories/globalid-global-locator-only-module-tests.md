---
title: "globalid-global-locator-only-module-tests"
status: done
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9278
claim: "2026-10-23T18:45:02Z"
assignee: "globalid-create-keeps-nil-params-in-gid-query"
blocked-by: null
closed-reason: null
---

## Context

`Locator.findAllowed` now tests `model_class <= klass` through
`rbClassInheritedP`, as `vendor/globalid/v1.3.0/lib/global_id/locator.rb:207-213`
does, so `only:` accepts a module. `global_id_test.rb`'s four module tests were
ported with it. The six `GlobalLocatorTest` module tests remain in
`scripts/parity/unported-files/unscoped.ts` ("globalid: module-based `only:`
filters"), with the old "TypeScript has no module-include relationship" reason:

- by GID / by SGID with only: restriction by module
- by GID / by SGID with only: restriction by module no match
- by GID / by SGID with only: restriction by multiple types w/module

(`vendor/globalid/v1.3.0/test/cases/global_locator_test.rb`).

## Acceptance criteria

- The six tests are ported to `packages/globalid/src/global-locator.test.ts`
  with Rails' names, the test models including `Identification` through
  `include()` and `PersonModel` extending ActiveModel's `Model`, as
  `global-id.test.ts` already does.
- Their row is removed from `unscoped.ts`.
