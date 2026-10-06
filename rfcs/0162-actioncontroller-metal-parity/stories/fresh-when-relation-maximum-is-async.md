---
title: "fresh_when's relation arm awaits maximum(:updated_at); expires_now/no_store use Hash#replace"
status: claimed
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-06T12:39:40Z"
assignee: "abstract-controller-drops-invented-available-actions"
blocked-by: null
closed-reason: null
---

## Context

`ConditionalGet#fresh_when`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/conditional_get.rb:140`)
derives `last_modified ||= object.try(:updated_at) || object.try(:maximum, :updated_at)`.
The second arm is for a relation, and `maximum` runs a query.

The port in `packages/actionpack/src/action-controller/metal/conditional-get.ts`
makes the same call, `tryCall(object, "maximum", "updatedAt")`, but trails'
`Relation#maximum` returns a promise and `freshWhen` is synchronous. Passing a
relation therefore hands a promise to `response.lastModified=`, which throws.
`expires_now` / `no_store` (`conditional_get.rb:308,330`) also open-code
`Hash#replace` because ruby-compat has no `hashReplace`.

## Acceptance criteria

- `freshWhen(relation)` sets `Last-Modified` from the relation's maximum
  `updated_at`, with a test under the Rails name from
  `actionpack/test/controller/render_test.rb`'s collection conditional-GET cases.
- `isStale` and `httpCacheForever` follow whatever shape `freshWhen` takes.
- `expiresNow` / `noStore` call a ruby-compat `Hash#replace` port.
