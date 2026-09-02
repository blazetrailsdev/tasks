---
title: "Object#in? has no Range branch, no ArgumentError arm, and sits outside core_ext/object"
status: draft
updated: 2026-09-02
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while triaging activesupport's in-closure skip stubs
(RFC 0105 `triage-activesupport-in-closure-skip-stubs`, trails#7369). Two
separate divergences in `Object#in?` / `Object#presence_in`.

**1. The Range branch is missing entirely.** Rails
(`activesupport/lib/active_support/core_ext/object/inclusion.rb:15-24`):

```ruby
def in?(another_object)
  case another_object
  when Range
    another_object.cover?(self)
  else
    another_object.include?(self)
  end
rescue NoMethodError
  raise ArgumentError.new("The parameter passed to #in? must respond to #include?")
end
```

trails' `isIn` (`packages/activesupport/src/enumerable-utils.ts:302-313`) has
neither arm: no `Range` case, and no `rescue NoMethodError` → `ArgumentError`
(it returns `false` for a non-collection instead of raising). A `Range` port
exists — `packages/ruby-compat/src/range.ts`, with `cover?` reachable through
`packages/activesupport/src/core-ext/range/compare-range.ts` — so this is a
gap, not a language shortcoming.

**2. It lives in the wrong file.** Rails puts both methods in
`core_ext/object/inclusion.rb`; trails has them in `enumerable-utils.ts`,
which has no Rails counterpart. `packages/activesupport/src/core-ext/object/`
already exists (`json.ts`, and the test file
`core-ext/object/inclusion.test.ts` is already at the convention path), so
`parity:api` maps the test file but not the source.

**3. Three tests credit Rails names without exercising the port.**
`packages/activesupport/src/core-ext/object/inclusion.test.ts`:

- `in range` substitutes an array (`[1,2,3,4,5]`) for Rails' `1..50`
  (`inclusion_test.rb:24-27`), so it re-tests the array branch.
- `in date range` (`inclusion_test.rb:34-38`, `Date.today.in?(..Date.tomorrow)`
  — beginless/endless ranges) never calls `isIn` at all; it asserts
  `inside >= start && inside <= end`, i.e. plain JS operators.
- `in hash` passes a plain object where Rails passes a Hash; correct by
  accident, but it should go through the ported Hash once one is in reach.

The `no method catching` stub (`1.in?(1)` → `ArgumentError`) is already owned by
RFC 0105 `port-inflector-dependencies-and-in-closure-residue`; the raise arm
this story adds is what unblocks it. `in module` (`Module#include?` ancestry) is
a landed case-level exclusion and is NOT in scope.

## Converged shape

- Move `isIn` and `presenceIn` to
  `packages/activesupport/src/core-ext/object/inclusion.ts`, re-exported so
  existing callers keep working, and keep the Rails parameter name
  `anotherObject`.
- Add the `Range` branch dispatching to `cover()`, and the `NoMethodError` →
  `ArgumentError("The parameter passed to #in? must respond to #include?")` arm
  with Rails' message verbatim.
- Rewrite `in range` and `in date range` to pass a real `Range` (beginless and
  endless included) through `isIn`.

## Acceptance criteria

- `isIn`/`presenceIn` live in `core-ext/object/inclusion.ts` with Rails' branch
  order, guards and error message.
- `in range` and `in date range` construct a `Range` and assert through `isIn`.
- `pnpm parity:api --package activesupport` and `pnpm parity:test --package activesupport`
  deltas are non-negative; `pnpm parity:api:extra:gate` stays clean.
