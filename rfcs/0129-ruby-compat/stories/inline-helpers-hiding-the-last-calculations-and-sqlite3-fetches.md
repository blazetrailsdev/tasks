---
title: "inline-helpers-hiding-the-last-calculations-and-sqlite3-fetches"
status: done
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: 7440
claim: "2026-09-03T11:50:57Z"
assignee: "inline-helpers-hiding-the-last-calculations-and-sqlite3-fetches"
blocked-by: null
closed-reason: null
---

## Context

Split out of `retire-missing-rails-call-fetch-receipts-activerecord` (RFC 0129,
closed by #7403), which took the measured 17 `@missingRailsCall fetch` receipts
in `activerecord` down to 10 by making the call against
`@blazetrails/ruby-compat`'s `fetch` (`rb_hash_fetch_m`,
`vendor/ruby/hash.c:2176`).

Of the 10 left, three are owned elsewhere and are NOT part of this story:
`abstract-adapter.ts:717` (the one `CONVERGEABLE` row, owned by
`abstract-adapter-constructor-drops-rails-config-arg`),
`abstract-mysql-adapter.ts:417` (owned by
`transaction-isolation-level-keys-are-symbol-spelled`), and
`type/hash-lookup-type-map.ts:110` (`@mapping` is a `Map`, and ruby-compat's
`fetch` takes a `Record<string, unknown>` — a receiver-shape question of its
own).

**The four this story covers**, each blocked by a body-shape difference rather
than by anything about `fetch`:

- `relation/calculations.ts:837` — `calculations.rb:570`
  `calculated_data.column_types.fetch(aliaz, Type.default_value)`, inside
  `execute_grouped_calculation`.
- `relation/calculations.ts:998` — `calculations.rb:604`
  `join.base_klass.attribute_types.fetch(name, nil)`, inside
  `lookup_cast_type_from_join_dependencies`. trails routes this through a
  `castTypeFromKlass` helper Rails does not have.
- `relation/calculations.ts:1024` — `calculations.rb:617-621`
  `model.attribute_types.fetch(name = result.columns[i]) do … end`, inside
  `type_cast_pluck_values`. trails routes this through
  `pluckCastTypeForKnownColumn`, also not in Rails.
- `connection-adapters/sqlite3-adapter.ts:1840` — `sqlite3_adapter.rb:837`
  `@config.fetch(:pragmas, {}).stringify_keys`. The call belongs to
  `configure_connection`'s own body in Ruby, but trails has split the pragma
  work into a `configurePragmas()` helper
  (`sqlite3-adapter.ts:1779-1800`), so converting it there would not credit the
  `configure_connection` pair the receipt sits on.

Every one of these is the same shape: trails extracted a helper Rails does not
have, which moved the `fetch` out of the body being compared. CLAUDE.md's
decomposition rule is the fix — "If Rails extracts a private helper, extract it,
with the Rails name. If Rails inlines something, inline it."

## Converged shape

Inline each extracted helper back into the Rails method that owns the call, then
make the `fetch` call there and delete the receipt. `castTypeFromKlass`,
`pluckCastTypeForKnownColumn` and `configurePragmas` are trails inventions; none
appears in `calculations.rb` or `sqlite3_adapter.rb`.

## Acceptance criteria

- [ ] The four sites call `@blazetrails/ruby-compat`'s `fetch` from the body
      Rails makes the call in, with their `@missingRailsCall fetch` receipts
      deleted and the settled `@missingRailsArgs fetch — PERMANENT` receipt
      added for the receiver-as-first-argument shape.
- [ ] The three trails-only helpers above are gone, or shown to have a Rails
      counterpart under a different name.
- [ ] The PR body reports the before/after `@missingRailsCall fetch` count for
      `activerecord` (10 → 6 if all four land).
- [ ] `parity:api:calls`, `:args`, `parity:api:extra:gate` and
      `parity:api:params` green, with no new baseline rows.
