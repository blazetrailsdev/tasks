---
title: "port-migration-compatibility-v7-0-and-older"
status: closed
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "i don't want this ported"
---

## Context

trails now ports `Migration::Compatibility.find` (`vendor/rails/activerecord/lib/active_record/migration/compatibility.rb:6-14`) as a const lookup over the `packages/activerecord/src/migration/compatibility.ts` module namespace, plus `V8_0 = Current` (`:32`) and the two delta-free classes `V7_2` (`:36`) and `V7_1` (`:39`). `Migration.forVersion` reaches it through `migration/compatibility-slot.ts`.

The classes that carry behaviour deltas are still unported, so `Migration[7.0]` and older raise `ArgumentError`:

- `V7_0 < V7_1` (`:42`) — `LegacyIndexName`, `add_column`/`change_column` datetime precision, `create_table` `_uses_legacy_table_name`, `new_column_definition`, etc.
- `V6_1` (`:160`), `V6_0` (`:216`), `V5_2` (`:246`), `V5_1` (`:280`), `V5_0` (`:300`), `V4_2` (`:399`).

Each is an independently shippable slice; land them oldest-last (each descends from the next).

## Acceptance criteria

- [ ] Each `V*` class is exported from `migration/compatibility.ts` with its Rails deltas, extending the next-newer class.
- [ ] `Migration.forVersion(x)` resolves each ported version.
- [ ] Tests mirror `vendor/rails/activerecord/test/cases/migration/compatibility_test.rb` for each delta, with Rails test names.
