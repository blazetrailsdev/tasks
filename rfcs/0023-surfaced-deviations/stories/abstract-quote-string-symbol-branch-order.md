---
title: "Move abstract quote's String/Symbol branch to the rb:75 position"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' abstract `quote` orders its `case` as
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:73-88`):

```ruby
when String, Symbol, ActiveSupport::Multibyte::Chars  # rb:75 — FIRST
when true / false / nil
when BigDecimal / Numeric
when Type::Binary::Data
when Type::Time::Value
when Date, Time
when Class
```

trails' `quote` (`packages/activerecord/src/connection-adapters/abstract/quoting.ts`)
puts the String/Symbol branch **second-to-last**, after null/boolean/BigDecimal/
Numeric/binary/Temporal, immediately before the `Class` branch.

**Behaviorally equivalent, so this is a fidelity/readability item, not a bug:**
the branch types do not overlap, so a `string` matches the same arm either way —
unlike, say, the Numeric/BigDecimal pair whose order does matter. Ruby's `case`
and the TS if-chain agree on every input.

Value in converging: `api:compare`'s file-structure/ordering checks and any
future reader diffing the two bodies line-by-line both key off order, and the
same divergence is likely mirrored in the dialect `quote` overrides
(`postgresql/quoting.ts`, `mysql/quoting.ts`, `sqlite3/quoting.ts`), each of
which front-loads its own dialect branches.

Surfaced in Copilot review #7 of #4870 as a pre-existing, out-of-scope
observation; filed here so it is tracked rather than re-derived.

## Acceptance criteria

- [ ] Abstract `quote`'s String/Symbol branch moves to the rb:75 position
      (first), with the remaining branches in rb:76-88 order.
- [ ] Behavior is unchanged on every existing input — this is a reordering, not
      a semantic change. The dialect `quote` overrides keep whatever branches
      they legitimately front-load (documented with the Rails anchor for why).
- [ ] Guard against the one real ordering hazard: BigDecimal must stay ahead of
      Numeric (rb:82-83), and binary ahead of Time/Date (rb:83-85).
- [ ] api:compare / test:compare delta non-negative.
