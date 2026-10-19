---
title: "polymorphic_url and handle_model_call take a record with no to_model"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `polymorphic_url` / `polymorphic_path` and
`HelperMethodBuilder#handle_model_call` take any record. For one that does not
respond to `to_model`, `polymorphic_mapping` reads the mapping by
`record.class.name`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/polymorphic_routes.rb:177-183`
and `:339-345`), which is how a plain class registered with `resolve` gets a
URL (`handle_model_call`, `:284-291`).

trails types the record as `ToModel`
(`packages/actionpack/src/action-dispatch/routing/polymorphic-routes.ts:10-12`,
`PolymorphicArg` at `:36`, `handleModelCall(target, record: ToModel)` at
`:304`), although the runtime `polymorphicMapping` already takes `unknown`.

`custom_url_helpers_test.rb:6-25,51-76` defines `Manufacturer`, `Article`,
`Page`, `CategoryPage` and `ProductPage` as plain classes with no
`ActiveModel::Conversion`. The port in
`packages/actionpack/src/action-dispatch/dispatch/routing/custom-url-helpers.test.ts`
carries five `as unknown as ToModel` casts to pass them.

## Acceptance criteria

- `PolymorphicArg` and `handleModelCall`'s `record` admit a record with no
  `toModel`.
- The five `as unknown as ToModel` casts in `custom-url-helpers.test.ts` are
  removed, and the test instance needs no cast to reach `polymorphicPath` /
  `polymorphicUrl`.
