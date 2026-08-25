---
title: "Raise Ruby's FrozenError, with rb_check_frozen's message, from initializeCopy's frozen guard"
status: done
updated: 2026-08-11
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6379
claim: "2026-08-11T21:26:07Z"
assignee: "burndown-order-only-rows-associations-remainder"
blocked-by: null
closed-reason: null
---

## Context

PR #6372 ported `d_lite_initialize_copy` (`date_core.c:5140-5182`) including its
`rb_check_frozen(copy)` guard (`:5142`). The guard is spelled with the closest
JS analogue rather than the Ruby one:

```ts
// packages/date/src/date.ts, Date#initializeCopy and DateTime#initializeCopy
if (Object.isFrozen(this)) {
  throw new TypeError(`can't modify frozen ${(this as object).constructor.name}`);
}
```

MRI raises a different class and a longer message (verified,
`ruby 3.3.11 -rdate`):

```ruby
Date.new(2001,2,3).freeze.send(:initialize_copy, Date.new(2002,1,1))
#=> FrozenError: can't modify frozen Date: #<Date: 2001-02-03 ((2451944j,0s,0n),+0s,2299161j)>
```

`FrozenError` is a `RuntimeError` subclass; `rb_check_frozen` builds the message
as `"can't modify frozen %s: %s"` over the receiver's class and its `inspect`.
The port's `TypeError` is what JS itself raises on a write to a frozen object,
which is why it was chosen, but it is not the Ruby class and the message drops
the `inspect` half.

The package already sets the precedent for porting a Ruby error class outright:
`ArgumentError` at `packages/date/src/date.ts:729-733` (and `Date::Error` as
`DateError`, `:4946-4950`), so this is not a language shortcoming.

## Converged shape

- A `FrozenError` class in `packages/date/src/date.ts` alongside `ArgumentError`,
  with `name = "FrozenError"`.
- Both `initializeCopy` guards raise it with `rb_check_frozen`'s full message,
  `can't modify frozen <Class>: <inspect>`, over the receiver's own `inspect`.
- The `"refuses a frozen receiver"` test in
  `packages/date/src/date.trails.test.ts` asserts the class and the full message
  instead of `TypeError` and the truncated one.
