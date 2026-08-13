---
title: "Port rb_warning so $VERBOSE-only gem warnings can be asserted, not approximated"
status: done
updated: 2026-08-13
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6473
claim: "2026-08-13T16:05:43Z"
assignee: "route-update-record-through-update-row"
blocked-by: null
closed-reason: null
---

## Context

ruby/date emits `rb_warning` from twelve sites in `date_core.c` when it silently
drops an argument it cannot use. trails ports the _effect_ at each one but never
the warning, and the position is currently recorded as prose in three JSDoc
comments rather than as tracked debt:

- `packages/date/src/date.ts:3112` — "The C's `rb_warning("invalid start is
ignored")` is a `$VERBOSE`-only warning with no analogue here, as `val2off`'s
  is." (`date_core.c:2460`, `:3140`, `:3325`, `:4289`, `:8246`)
- `packages/date/src/date.ts:4299` — same for
  `rb_warning("fraction of offset is ignored")` (`date_core.c:2395`, `:2426`,
  `:3118`)
- `dt_new_by_frags`' offset bound, ported at `packages/date/src/date.ts`
  `dtNewByFrags`, drops `of` to `0` outside ±`DAY_IN_SECONDS` but does not warn
  (`date_core.c:8301-8305`, and the same guard at `:3135`, `:5075`, `:8219`)

This is measurable, not cosmetic: `test_date_strftime.rb:194-198` asserts the
warning directly with `assert_warning(/invalid offset/)`, and PR #6311 could
only port that arm by asserting the _effect_ (`zone` becomes `+00:00`) instead.
Other `test/date/` files use `assert_warning` the same way, so every one of them
will land as a weakened assertion until this exists.

## Acceptance criteria

- [ ] `packages/date/src` gains an `rbWarning` seam that mirrors MRI's
      `rb_warning`: emitted only when Ruby's `$VERBOSE` is true, so it is silent
      by default and does not spam a normal run.
- [ ] The three sites above call it with the C's message string verbatim
      ("invalid start is ignored", "fraction of offset is ignored", "invalid
      offset is ignored"), at the same point in the body the C emits from.
- [ ] The three JSDoc comments recording "no analogue here" are deleted — they
      are the prose this story converges.
- [ ] `test_strftime__offset` in
      `packages/date/src/test-date-strftime.test.ts` asserts the warning rather
      than the effect, matching `test_date_strftime.rb:194-198`.
- [ ] Decide and record how a test opts into `$VERBOSE` (Ruby's
      `assert_warning` sets it); a vitest-side helper is fine, but it must not
      leak the flag across files.

## Notes

Scope is the three cited sites, not all twelve `rb_warning` calls — the rest sit
in bodies not yet ported. Widen only if a port lands one of them meanwhile.
