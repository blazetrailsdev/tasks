---
title: "Date#inspect spells a non-finite start Inf/-Inf, as mk_inspect's %.0f does"
status: done
updated: 2026-08-13
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6464
claim: "2026-08-13T14:06:37Z"
assignee: "extra-surface-scores-overridden-ruby-files"
blocked-by: null
closed-reason: null
---

## Context

`mk_inspect` (`vendor/date/ext/date/date_core.c:7032-7041`) renders the reform
start with `%.0f`. C's `printf` spells a non-finite double `inf` / `-inf`, and
MRI's `Float#to_s` path gives the capitalised form, so a date read under
`Date::JULIAN` or `Date::GREGORIAN` inspects as:

    $ ruby -rdate -e 'puts Date.new(2001,2,3,Date::JULIAN).inspect'
    #<Date: 2001-02-03 ((2451957j,0s,0n),+0s,Infj)>
    $ ruby -rdate -e 'puts Date.new(2001,2,3,Date::GREGORIAN).inspect'
    #<Date: 2001-02-03 ((2451944j,0s,0n),+0s,-Infj)>

`Date#inspect` in `packages/date/src/date.ts` spells that field with
`this.start.toFixed(0)`, and JS `Number.prototype.toFixed` answers
`"Infinity"` / `"-Infinity"`:

    #<Date: 2001-02-03 ((2451957j,0s,0n),+0s,Infinityj)>
    #<Date: 2001-02-03 ((2451944j,0s,0n),+0s,-Infinityj)>

Every finite `start` already matches MRI byte-for-byte (verified against
`ruby -rdate` in PR #6312), so this is the only spelling left divergent.

Introduced by PR #6312, which ported `Date#inspect` for
`test/date/test_date_attr.rb`'s `test__attr`. No test asserts an infinite-start
`inspect` today, which is why it landed green.

## Converged shape

`Date#inspect` renders `Inf` / `-Inf` for a non-finite `start` and keeps
`toFixed(0)` for a finite one.

While in this method, also reconsider `this.constructor.name`, which stands in
for `mk_inspect`'s `rb_obj_class(self)` argument. It is correct under `tsc` but
is a class NAME read at runtime, and a bundler that renames classes changes the
output (see the esbuild class-rename note that already bit the canonical-model
import path). A brand or an explicit per-class literal would be sturdier.

## Acceptance criteria

- [ ] `new Date(2001, 2, 3, Date.JULIAN).inspect()` ends `,+0s,Infj)>` and the
      `Date.GREGORIAN` form ends `,+0s,-Infj)>`, matching `ruby -rdate`.
- [ ] Finite starts are unchanged: `new Date(2001, 2, 3).inspect()` stays
      `#<Date: 2001-02-03 ((2451944j,0s,0n),+0s,2299161j)>`.
- [ ] A cover in `packages/date/src/date.trails.test.ts` pins both non-finite
      spellings.
- [ ] `pnpm vitest run packages/date/src` green; `pnpm parity:test --package
date` does not regress.
