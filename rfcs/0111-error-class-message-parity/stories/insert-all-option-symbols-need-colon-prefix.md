---
title: "insertAll's on_duplicate and returning carry Ruby Symbols, so disallow_raw_sql! can drop its permit matcher"
status: ready
updated: 2026-09-09
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 19
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `InsertAll#disallow_raw_sql!` in PR #7605, which is
now blocked on this
(`insert-all-disallow-raw-sql-no-permit-matcher`).

Rails
(`vendor/rails/activerecord/lib/active_record/insert_all.rb:212-219`):

```ruby
def disallow_raw_sql!(value)
  return if !value.is_a?(String) || Arel.arel_node?(value)

  raise ArgumentError, "Dangerous query method (method whose arguments are used as raw " \
                       "SQL) called: #{value}. " \
                       "Known-safe values can be passed " \
                       "by wrapping them in Arel.sql()."
end
```

It rejects **every** raw String and has no permit matcher, because the values
it guards are Symbols: `insert_all.rb:24-25` passes `on_duplicate` (`:raise` /
`:skip` / `:update`) and `returning` (a Symbol array such as `%i[id name]`),
and a Symbol never reaches the String branch.

trails spells a Ruby Symbol as a JS string (CLAUDE.md, "A Ruby Symbol is a JS
string, never a JS `Symbol`"), so at this one call site the two Ruby types
collapse into one JS type and the guard cannot tell `:skip` from the raw SQL
string `"skip"`. PR #7605 therefore converged everything else —
`packages/activerecord/src/insert-all.ts` now raises `ArgumentError` with
`insert_all.rb:215-218`'s message verbatim and guards on `Arel.arelNode`,
mirroring `Arel.arel_node?`, and both call sites are unconditional as at
:24-25 — but had to keep the trails-invented `permit: RegExp =
COLUMN_NAME_WITH_ORDER` parameter. Without it,
`disallowRawSqlBang(options.onDuplicate)` raises on the legitimate values
`relation.ts:917,936,1334` pass, and `returning: ["id"]` raises too.

## Converged shape

Apply the settled colon-prefixed-Symbol idiom to `insertAll` / `upsertAll`'s
option surface, so the discriminator Ruby gets from the type survives in the
value:

- `onDuplicate` carries `":raise"` / `":skip"` / `":update"`, matching the
  Symbols at `insert_all.rb:24` and `relation.rb`'s `insert_all` / `upsert_all`
  / `insert_all!` seats; `relation.ts:917,936,1334` and
  `InsertAllOptions["onDuplicate"]` follow, and the `.slice(1)` happens where
  the name is needed.
- `returning`'s column entries likewise, matching Rails' `returning: %i[...]`.
- `disallowRawSqlBang` then drops `permit` and `COLUMN_NAME_WITH_ORDER`
  entirely and becomes `insert_all.rb:212-219` line for line, at which point a
  plain string `onDuplicate` / `returning` raises exactly as Rails does — which
  is `insert-all-disallow-raw-sql-no-permit-matcher`'s remaining acceptance
  criterion.

This is a public option-surface change, so it needs its own PR and its own
review; do not fold it into a `disallow_raw_sql!` diff.

## Acceptance criteria

- [ ] `onDuplicate` and `returning` carry Ruby's Symbols as colon-prefixed
      strings across `insert-all.ts`, `relation.ts` and the tests.
- [ ] `disallowRawSqlBang` takes one argument, has no permit matcher, and is
      `insert_all.rb:212-219` line for line.
- [ ] A cover pins that a plain-string `onDuplicate` / `returning` raises and
      that `":skip"` does not — it must fail on baseline.
- [ ] `pnpm parity:api:calls` / `:args` / `:extra:gate` clean.
- [ ] Unblocks `insert-all-disallow-raw-sql-no-permit-matcher`.
