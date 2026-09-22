---
title: "activemodel-errors-does-not-include-enumerable"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced converging `errors_test.rb`'s assertions (RFC 0132,
`assertions-activemodel-errors-cluster`), and confirmed by review of trails#7900.

`ActiveModel::Errors` is `include Enumerable`
(`vendor/rails/activemodel/lib/active_model/errors.rb:41`), so `map`, `first`
and the block form of `any?` are all part of its public surface and three tests
exercise them directly.

`packages/activemodel/src/errors.ts` defines only `each(fn)` — there is no
`map`, no `first`, and `any` is a zero-argument getter that takes no block. The
first pass of trails#7900 reached around the gap by reading the backing
`objects` array, which lets each test pass whether or not the Rails API exists.
That is exactly the wrong shape, so all three are now parked instead.

Parked `it.skip` with `BLOCKED: activemodel-errors-does-not-include-enumerable`
in `packages/activemodel/src/errors.test.ts`, each body converged to Rails'
assertions and reaching the missing member through a cast so the file
typechecks:

- `each when arity is negative` (`errors_test.rb:47-53`) —
  `assert_equal([:name, :gender], errors.map(&:attribute))`
- `any?` (`errors_test.rb:55-60`) — the `assert errors.any? { |_| true }` half;
  the `assert_predicate errors, :any?` half already passes
- `first` (`errors_test.rb:62-68`) — `assert_kind_of ActiveModel::Error, errors.first`

Rails reaches all three through `Enumerable` over `each`, which trails already
has, so the port is the `include(Errors, Enumerable)` edge rather than three
hand-written members.

## Acceptance criteria

- `Errors` mixes in an Enumerable whose `map`, `first` and block-taking `any`
  come from its `each`, mirroring `errors.rb:41`.
- The three tests above are un-skipped, the casts removed, and they pass.
