---
title: "Ruby String#split drops trailing empty fields; JS keeps them"
status: draft
updated: 2026-08-17
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `String#split` drops trailing empty fields; JS's does not. Rails'
`ActionDispatch::Response#cookies`
(vendor/rails/actionpack/lib/action_dispatch/http/response.rb:418-430) relies
on this:

```ruby
key, value = pair.split("=").map { |v| Rack::Utils.unescape(v) }
```

For a deleted cookie the pair is `"login="`, so Ruby yields `["login"]` and
`cookies["login"]` is `nil`. The trails port
(packages/actionpack/src/action-dispatch/http/response.ts, `get cookies()`)
gets `["login", ""]` from JS and stores `""`. Rails'
`test "delete cookies"` (actionpack/test/dispatch/response_test.rb:246-250)
asserts `{ "user_name" => "david", "login" => nil }`; our converged test
asserts `login: ""`.

The divergence is documented in the getter's JSDoc, landed with PR #6671.

## Converged shape

A shared `split` idiom helper (or a per-call-site trailing-empty trim) that
reproduces Ruby's default `split(sep)` semantics — drop trailing empty
fields, keep interior ones — so ported bodies can spell `split` and get Ruby's
result. Then `cookies` needs no note and the Rails test value (`nil`) holds.

This is a conversion class, not a one-off: every ported `String#split` without
an explicit limit has the same latent gap.

## Acceptance criteria

- [ ] The Ruby `split` trailing-empty-field semantics are available to ported bodies.
- [ ] `Response#cookies` returns `undefined` for `"login="`, matching response_test.rb:246-250.
- [ ] The JSDoc divergence note in response.ts is removed.
