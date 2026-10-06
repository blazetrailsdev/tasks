---
title: "fresh_when's try(:maximum, :updated_at) finds no Enumerable#maximum on an Array of records"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8577
claim: "2026-10-06T14:09:41Z"
assignee: "fresh-when-array-of-records-has-no-enumerable-maximum"
blocked-by: null
closed-reason: null
---

## Context

`ConditionalGet#fresh_when`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/conditional_get.rb:140`)
derives `last_modified ||= object.try(:updated_at) || object.try(:maximum, :updated_at)`.
For an Array of records the second arm answers, because ActiveSupport defines
`Enumerable#maximum` as `map(&key).max`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:40-42`).

`packages/actionpack/src/action-controller/metal/conditional-get.ts` ports the
arm as `tryCall(object, "maximum", "updatedAt")`. A JS array has no `maximum`
member, so `tryCall` answers `undefined`, `Last-Modified` is never set, and
`stale?([record, old_record])` never answers 304.
`packages/activesupport/src/enumerable-utils.ts:209` has a free
`maximum(collection, key)` taking a function, not a key name, and nothing
dispatches `try` to it.

Three `LastModifiedRenderTest` tests
(`vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb:586-612`) are
parked `it.skip` under `BLOCKED:` naming this story in
`packages/actionpack/src/action-controller/controller/render.test.ts`:
"responds with last modified with array of records", "request not modified with
array of records" and "request modified with array of records".

Related: `fresh-when-relation-maximum-is-async` covers the same line's relation
receiver.

## Acceptance criteria

- `freshWhen([record, oldRecord])` sets `Last-Modified` to the newest
  `updatedAt`, through the same `try(:maximum, :updated_at)` call Rails makes,
  with no Array arm Rails does not have.
- The three parked tests are unskipped and pass.
