---
title: "activemodel-error-message-nil-raw-type-cast-to-string"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8113
claim: "2026-09-25T21:47:29Z"
assignee: "activemodel-error-message-nil-raw-type-cast-to-string"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-error-type-default-swallows-explicit-nil`. `Error#raw_type`
may now be `nil` (`errors.add(:baz, nil)`, `vendor/rails/activemodel/lib/active_model/error.rb:102-108`),
and Rails' `Error#message` (`error.rb:132-139`) answers `raw_type` itself in its
`else` arm — so `message` is `nil` for such an error, and `Errors#messages_for`,
`#to_hash`, `#delete` and `#full_message` carry that `nil` through.

trails' `Error#message` (`packages/activemodel/src/error.ts`, `get message()`) is
typed `string` and returns `this.rawType as string`: the runtime value is already
`null`, but the cast hides it from every caller. Typing it `string | null`
ripples into `messagesFor` / `toHash` / `delete` / `fullMessages` and their
activerecord / actionview callers, which is why it was not done in the same PR.

Related: `NestedError`'s constructor (`packages/activemodel/src/nested-error.ts`)
reads `innerError.rawType ?? innerError.type`, where Rails'
`nested_error.rb` takes `inner_error.raw_type` as-is — an inner error with a
`nil` raw type gets its `type` instead.

## Acceptance criteria

- `Error#message` is typed `string | null` and the `as string` cast is gone;
  callers handle the `nil` arm the way Rails' do.
- `NestedError` takes the inner error's `rawType` unchanged, `nil` included.
