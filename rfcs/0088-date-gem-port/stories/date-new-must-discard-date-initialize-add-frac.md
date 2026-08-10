---
title: "date-new-must-discard-date-initialize-add-frac"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6333
claim: "2026-08-10T13:05:58Z"
assignee: "date-new-must-discard-date-initialize-add-frac"
blocked-by: null
closed-reason: null
---

## Context

PR #6317 landed `num2int_with_frac` / `add_frac` on the `Date`-side builders
(`packages/date/src/date.ts`: `Date.jd`, `Date.ordinal`, `Date.commercial`, and
the constructor), closing
`date-side-builders-drop-num2int-with-frac-and-add-frac`. `Date.civil` gets its
fraction by delegating to the constructor, which ends with

```ts
return addFracTo(this, fr2);
```

A TS constructor that returns an object makes `new` answer THAT object, so
`new Date(2001, 2, 3.5)` now carries a day fraction. MRI does not:

```ruby
# ruby 3.3.11 -rdate
Date.new(2001, 2, 3.5).day_fraction   #=> 0
Date.civil(2001, 2, 3.5).day_fraction #=> (1/2)
```

The two differ because `add_frac()` lives inside `date_initialize`
(`date_core.c:3556-3558`, `ret = self; add_frac(); return ret;`) and
`date_s_civil` (`:3478`) answers `date_initialize`'s return value directly,
while `Date.new` reaches the same C function through `Class#new`, which
**discards** `initialize`'s return. There is no TS analogue of that discard —
the constructor's return _is_ what `new` gives — so the two readings cannot
both come from delegation.

## Converged shape

Keep `date_initialize`'s `fr2` on the instance (a private field, cited to
`date_core.c:3512`) and move the `add_frac()` step into `Date.civil`, which is
the only caller MRI lets see it. The constructor then answers a simple date, as
`Date.new` does, and `Date.civil` answers the complex one.

## Acceptance criteria

- [ ] `new Date(2001, 2, 3.5).dayFraction` is `0` and the receiver is simple
      (`complexDatP()` is `false`), as MRI's `Date.new` is.
- [ ] `Date.civil(2001, 2, 3.5)` still carries `(1/2)`, and `Date.jd`,
      `Date.ordinal` and `Date.commercial` are untouched.
- [ ] Covered in `packages/date/src/date.trails.test.ts` on the gem-shaped
      receiver, which is the only seat that shows a day fraction.
