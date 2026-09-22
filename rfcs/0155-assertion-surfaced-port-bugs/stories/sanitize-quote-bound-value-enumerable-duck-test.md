---
title: "sanitize-quote-bound-value-enumerable-duck-test"
status: in-progress
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7952
claim: "2026-09-22T13:26:14Z"
assignee: "assertions-activesupport-multibyte-chars-port"
blocked-by: null
closed-reason: null
---

## Context

`sanitize_test.rb`'s `test_bind_enumerable`, `test_bind_range` and
`test_bind_empty_range` are parked `it.skip` in
`packages/activerecord/src/sanitize.test.ts` because trails'
`quote_bound_value` does not mirror Rails'.

Rails (`activerecord/lib/active_record/sanitization.rb:191-200`):

```ruby
def quote_bound_value(connection, value)
  if value.respond_to?(:map) && !value.acts_like?(:string)
    values = value.map { |v| v.respond_to?(:id_for_database) ? v.id_for_database : v }
    ...
```

trails (`packages/activerecord/src/sanitization.ts:321`) narrows that duck test
to `Array.isArray(value) || value instanceof Set`, so any other Ruby-Enumerable
value falls through to the scalar arm and the adapter raises
`TypeError: can't quote <Class>`:

- a plain object with `each`/`map` (Rails' `SimpleEnumerable`,
  `sanitize_test.rb:146-155`) — `can't quote SimpleEnumerable`
- `Range` (`packages/ruby-compat/src/range.ts:43`) — `can't quote Range`;
  Ruby `Range` includes `Enumerable`, trails' `Range` declares `each` but no
  `map`.

Converging is not purely local: the faithful test is
`rbObjRespondTo(value, "map") && !Object.actsLike(value, "string")`
(`packages/ruby-compat/src/object.ts:69`,
`packages/activesupport/src/core-ext/object/acts-like.ts:5`), and a JS `Set`
has no `.map` where Ruby's `Set` does — so the two trails-only `Set` tests in
`sanitize.test.ts` ("handles Sets as bind values", "handles empty Sets as bind
values") have to be reconciled in the same change, and `Range` needs the
`Enumerable#map` it is missing.

## Acceptance criteria

- `quoteBoundValue` mirrors `sanitization.rb:191-200`'s duck test.
- `ruby-compat`'s `Range` answers `map` (Ruby `Enumerable#map` on a `Range`).
- The three parked tests in `packages/activerecord/src/sanitize.test.ts` are
  un-skipped and green, with their BLOCKED lines removed.
- The JS-`Set` bind path is either kept (with a receipt) or its trails-only
  tests dropped — decided explicitly, not by accident.
