---
title: "Resolve Time#acts_like_time?, the last member left unpaired in time-ext.ts"
status: in-progress
updated: 2026-08-20
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6752
claim: "2026-08-19T23:52:33Z"
assignee: "restore-transaction-record-state-composite-pk-arm"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `split-time-ext-by-receiver-onto-the-rails-layout` (PR #6740).
After the split, `packages/activesupport/src/time-ext.ts` pairs with
`core_ext/time/calculations.rb` (38/38) — and still, as a leftover, with
`core_ext/time/acts_like.rb`, which scores 0/1:

```ruby
# vendor/rails/activesupport/lib/active_support/core_ext/time/acts_like.rb:6-8
class Time
  def acts_like_time?
    true
  end
end
```

`parity:api --missing` reports `acts_like_time? → isActsLikeTime` as the sole
gap in that bucket.

This is NOT automatically a `SKIP_GROUPS` case. The two sibling markers ARE
skipped, with a reason recorded in `docs/ruby-ts-conventions.md:176`:
`Date#acts_like_date?` (`core_ext/date/acts_like.rb:7`) and DateTime's pair
(`core_ext/date_time/acts_like.rb:8-14`) are skipped because their trails
receivers are `Temporal.PlainDate` / `Temporal.PlainDateTime` — built-ins the
port does not reopen — and `Object#acts_like?`'s `:date` / `:time` arms answer
from the receiver's own type instead
(`core-ext/date-and-time/calculations.ts:200-210`). The same doc note records
that `TimeWithZone#acts_like_time?` IS a real method on a trails-owned class
and IS ported (`time-with-zone.ts:935`).

So the open question this story answers is which of those two the `Time`
receiver is. `time-ext.ts`'s members take a JS `Date` / `Temporal.Instant`,
which points at the skip arm — but `@blazetrails/date` exports a real, trails-
owned `Time` class (`packages/date/src/time.ts`), which points at the port arm,
the same way `TimeWithZone` did.

## Converged shape

Determine the receiver, then take exactly one of:

- If `@blazetrails/date`'s `Time` is the receiver `Object#acts_like?`'s `:time`
  arm should consult, port `isActsLikeTime` onto it at the Rails name, the way
  `TimeWithZone#acts_like_time?` already is, and credit the bucket.
- If the receiver really is the un-reopenable JS `Date` / `Temporal.Instant`,
  extend the EXISTING `SCOPED_SKIP_GROUPS` entry in
  `scripts/parity/conventions.ts` that already covers the `date/acts_like.rb`
  and `date_time/acts_like.rb` markers to cover `time/acts_like.rb` too, with
  the same reason — scoped to that file, not a global skip.

Check `SCOPED_SKIP_GROUPS` before adding anything: an entry overlapping a
global `SKIP_GROUPS` reds `conventions.test.ts`.

## Acceptance criteria

- [ ] `core_ext/time/acts_like.rb` no longer reports a missing member — either
      because `acts_like_time?` is ported at its conventions-table name, or
      because the file is covered by the existing scoped skip with its reason.
- [ ] `Object#acts_like?`'s `:time` arm is consistent with whichever answer is
      taken.
- [ ] `pnpm parity:api` delta non-negative; `conventions.test.ts` green.
