---
title: "abstract-quote-binary-data-self-dispatch"
status: done
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4870
claim: "2026-07-14T19:21:13Z"
assignee: "abstract-quote-binary-data-self-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AbstractAdapter#quote` dispatches binary via `when Type::Binary::Data
then quoted_binary(value)` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:83`),
self-dispatched on `self` so an adapter's `quoted_binary` override applies.

Trails' abstract `quote`
(`packages/activerecord/src/connection-adapters/abstract/quoting.ts`) has **no**
`BinaryData` branch — `grep BinaryData` on that file is empty — so
`AbstractAdapter#quote(new BinaryData(...))` throws `can't quote BinaryData`
where Rails quotes it. Each adapter re-implements rb:83 locally instead:

- `packages/activerecord/src/connection-adapters/postgresql/quoting.ts:165`
- `packages/activerecord/src/connection-adapters/mysql/quoting.ts:190`
- `packages/activerecord/src/connection-adapters/sqlite3/quoting.ts:93`

Those same three adapters also short-circuit `value instanceof Uint8Array`
(`postgresql/quoting.ts:163`, `mysql/quoting.ts:188`, `sqlite3/quoting.ts:90`)
by calling their **module-level** `quotedBinary` directly, bypassing the
adapter's own `quotedBinary` override (e.g. `postgresql-adapter.ts:4174`). Rails
self-dispatches unconditionally. This is behaviorally a no-op for the three
shipped adapters today (each override delegates to the same module function),
so this is a fidelity/structure fix, not a bug fix.

PR #4868 added `dispatchQuotedBinary` to `abstract/quoting.ts` — the self-
dispatch helper this port needs, mirroring the existing `dispatchQuotedDate`
pattern — while fixing an unrelated ArrayBuffer-view regression. It deliberately
did not port rb:83 or collapse the adapter copies: that is a coherent change
across abstract + 3 adapters + their tests, and landing half of it would leave
duplicate dispatch behind.

## Acceptance criteria

- [ ] Abstract `quote` gains `if (value instanceof BinaryData) return dispatchQuotedBinary(this, value.bytes);`
      at the rb:83 position (after the Numeric branch, before Time/Date).
- [ ] The three adapters' redundant `BinaryData` / `Uint8Array` branches collapse
      onto the inherited abstract dispatch, or each remaining branch is
      documented with the Rails anchor for why it must stay (e.g. a genuine
      dialect-specific override).
- [ ] Binary quoting self-dispatches through the host uniformly — the same value
      class does not take two dispatch paths depending on ArrayBuffer view type.
- [ ] Adapter `quotedBinary` overrides are honored on every binary path.
- [ ] api:compare / test:compare delta non-negative.
