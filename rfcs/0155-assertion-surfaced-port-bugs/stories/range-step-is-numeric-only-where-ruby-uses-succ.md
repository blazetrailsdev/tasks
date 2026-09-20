---
title: "range-step-is-numeric-only-where-ruby-uses-succ"
status: draft
updated: 2026-09-20
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

Converging `core_ext/range_ext_test.rb`'s `test_date_time_with_each` /
`test_date_time_with_step` under RFC 0132 surfaced that `Range#step` only
handles numeric endpoints.

Rails (`vendor/rails/activesupport/test/core_ext/range_ext_test.rb:273-281`):

```ruby
def test_date_time_with_each
  datetime = DateTime.now
  assert(((datetime - 1.hour)..datetime).each { })
end

def test_date_time_with_step
  datetime = DateTime.now
  assert(((datetime - 1.hour)..datetime).step(1) { })
end
```

Ruby's `range_step` (`vendor/ruby/range.c:439`) iterates a non-numeric range
through `succ`, which is why a `DateTime` range enumerates at all.

trails' `Range#step` (`packages/ruby-compat/src/range.ts:217-227`) casts both
endpoints to `number` and drives the loop with `>` and `+=`:

```ts
let current = this.first() as number;
if (this.excludeEnd ? current >= end : current > end) break;
current += n;
```

Against a `Temporal.PlainDateTime` / `ZonedDateTime` the polyfill rejects the
comparison outright:

```text
TypeError: Do not use built-in arithmetic operators with Temporal objects.
  at Range.step packages/ruby-compat/src/range.ts:223:48
```

`Range#each` (`range.ts:213-215`) is `yield* this.step(1)`, so both arms fail
the same way. Note `isInclude` (`range.ts:156-190`) already has a `succ`-driven
path for String endpoints; `step` has no equivalent.

Both tests are parked `it.skip` in
`packages/activesupport/src/core-ext/range-ext.test.ts` with converged bodies —
Rails' `DateTime.now` receiver and one truthy assertion each — and a `BLOCKED:`
line pointing here. They previously "passed" only because they iterated a
numeric range, which asserts nothing about the DateTime case.

## Acceptance criteria

- [ ] `Range#step` iterates a non-numeric endpoint through `succ`, as
      `vendor/ruby/range.c:439` does, rather than casting to `number`.
- [ ] The two parked tests are un-skipped and green with their converged bodies
      unchanged.
- [ ] `pnpm parity:test -- --package activesupport --assertions` reports
      `core_ext/range_ext_test.rb` at 0/0/0.
