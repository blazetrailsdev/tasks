---
title: "activemodel-errors-frozen-empty-array-raises-typeerror"
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
`assertions-activemodel-errors-cluster`).

Rails freezes the empty array `Errors#messages` / `Errors#details` hand back for
an absent attribute, so mutating it raises `FrozenError`:

```ruby
# vendor/rails/activemodel/test/cases/errors_test.rb:458-464, 628-634
assert_equal [], errors.messages[:foo]
assert_raises(FrozenError) { errors.messages[:foo] << "foo" }
assert_raises(FrozenError) { errors.messages[:foo].clear }
```

trails' `EMPTY_ARRAY` (`packages/activemodel/src/errors.ts:16`) is a plain
`Object.freeze([])`, so a `push` raises a JS `TypeError`
("Cannot add property 0, object is not extensible"), not ruby-compat's
`FrozenError` (`packages/ruby-compat/src/frozen-error.ts`). The `equal` arms of
both tests pass; only the two `raises` arms diverge.

Parked `it.skip` with
`BLOCKED: activemodel-errors-frozen-empty-array-raises-typeerror` in
`packages/activemodel/src/errors.test.ts`:

- `messages returns empty frozen array when accessed with non-existent attribute`
- `details returns empty array when accessed with non-existent attribute`

Both bodies are converged to Rails' three assertions and use
`assertRaises([FrozenError], {}, …)`.

## Acceptance criteria

- Mutating the empty array either reader returns raises `FrozenError`.
- Both tests are un-skipped and pass.
