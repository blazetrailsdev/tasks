---
title: "mapper-resources-takes-one-name-not-a-splat"
status: draft
updated: 2026-10-12
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mapper::Resources#resources` takes a splat:
`def resources(*resources, &block)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1518`), and
`resource` likewise. trails' `resources(name, optionsOrCallback, callback)`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts:920`) and
`resource` (`:1066`) take exactly one name, and overload the second slot on
`typeof`.

`custom_url_helpers_test.rb:91` draws
`resources :categories, :collections, :products, :manufacturers`. The port in
`packages/actionpack/src/action-dispatch/dispatch/routing/custom-url-helpers.test.ts`
writes four `this.resources(...)` calls because the one-name signature cannot
express it.

## Acceptance criteria

- `resources` and `resource` accept every name Rails' splat accepts, followed
  by the options and the block.
- `custom-url-helpers.test.ts` draws the four resources in one call, as
  `custom_url_helpers_test.rb:91` does.
