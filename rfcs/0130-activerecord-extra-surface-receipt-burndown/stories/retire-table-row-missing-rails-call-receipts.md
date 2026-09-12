---
title: "Retire the five @missingRailsCall receipts in fixture-set/table-row.ts"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/fixture-set/table-row.ts` (ported in PR #7723 from
`vendor/rails/activerecord/lib/active_record/fixture_set/table_row.rb`) carries five
`@missingRailsCall` receipts. None of them is a real omission — each marks a Ruby call the TS body
makes under a different spelling that the call gate cannot credit. They are receipts standing in
for two fixable gaps.

**1. `Hash#delete` has no ruby-compat export.** Rails deletes the association key from the row:

    # table_row.rb:160  `value = @row.delete(association.name.to_s)`
    # table_row.rb:186  `if (targets = @row.delete(association.name.to_s))`

JS spells that as the `delete` operator, which is not a call, so the gate sees the call dropped.
`scripts/parity/ruby-compat.ts` has rows for `Hash#key?`, `Hash#include?`, `Hash#fetch`,
`Hash#except`, `Hash#slice`, `Hash#merge`, `String#delete` — but none for `Hash#delete`, and
`packages/ruby-compat/src/hash.ts` exports no counterpart. Receipts:
`@missingRailsCall delete — PERMANENT` on `resolveStiReflections` and `addJoinRecords`.

**2. `Hash#include?` is credited only for a hash-kind receiver.** The body already calls
ruby-compat's `hasKey`, which `scripts/parity/ruby-compat.ts:99` maps `Hash#include?` to
(MRI defines `include?` onto `rb_hash_has_key`, `vendor/ruby/hash.c:7255`). That row carries
`receiver: "hash"`, and the Ruby receiver here is the ivar `@row`
(`table_row.rb:113` `@row.include?(...)`, `:172`, `:181`), whose
`callReceivers` kind is not `hash`, so the row is not consulted. Receipts:
`@missingRailsCall include? — PERMANENT` on `reflectionClass`, `isColumnDefined`, `resolveEnums`.
Note `Hash#key?` in the same file IS credited, because its ruby-compat row is unconditional —
so the two spellings of the same question score differently.

## Converged shape

- Add `Hash#delete` to `packages/ruby-compat/src/hash.ts` as the port of
  `vendor/ruby/hash.c` `rb_hash_delete` (returns the stored value, or nil when absent — the
  distinction `delete obj[k]` cannot express), with the `@noRailsEquivalent PERMANENT` Ruby-core
  receipt shape its siblings use, and register it in `scripts/parity/ruby-compat.ts`. Then
  `table-row.ts` calls it and both `delete` receipts are deleted.
- Teach the ruby-compat alias lookup to admit an ivar receiver for the `Hash#` rows whose
  spelling is unambiguous (`include?` → `hasKey`), or give `Hash#include?` the unconditional
  treatment `Hash#key?` already has. Then the three `include?` receipts are deleted.

Both halves are verified by the receipts disappearing with `pnpm parity:api:calls` still green;
neither may be closed by rewording a receipt.

## Acceptance criteria

- [ ] `ruby-compat` exports a `Hash#delete` port, registered in `scripts/parity/ruby-compat.ts`.
- [ ] All five `@missingRailsCall` receipts in `fixture-set/table-row.ts` are deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green, with no new baseline rows.
