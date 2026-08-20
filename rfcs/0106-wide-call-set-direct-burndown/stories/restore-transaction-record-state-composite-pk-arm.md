---
title: "Port restore_transaction_record_state's attribute map and its missing composite-PK arm"
status: in-progress
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6752
claim: "2026-08-19T23:52:33Z"
assignee: "restore-transaction-record-state-composite-pk-arm"
blocked-by: null
closed-reason: null
---

# `restore_transaction_record_state` rebuilds via the dirty tracker, and drops the composite-PK arm

## Context

Surfaced while converging `transactions.json`'s `kind: "set"` rows in PR #6737
(RFC 0106 wave 4c). One of the 5 rows left in that shard:

```text
transactions.ts  restore_transaction_record_state  ->  map
```

Rails rebuilds the attribute set by mapping the snapshot, then restores the
primary key with an explicit composite arm:

```ruby
# vendor/rails/activerecord/lib/active_record/transactions.rb:467-491
def restore_transaction_record_state(force_restore_state = false)
  if restore_state = @_start_transaction_state
    if force_restore_state || restore_state[:level] <= 1
      @new_record = restore_state[:new_record]
      @previously_new_record = restore_state[:previously_new_record]
      @destroyed  = restore_state[:destroyed]
      @attributes = restore_state[:attributes].map do |attr|
        value = @attributes.fetch_value(attr.name)
        attr = attr.with_value_from_user(value) if attr.value != value
        attr
      end
      @mutations_from_database = nil
      @mutations_before_last_save = nil
      if self.class.composite_primary_key?
        if restore_state[:id] != @primary_key.map { |col| @attributes.fetch_value(col) }
          @primary_key.zip(restore_state[:id]).each do |col, val|
            @attributes.write_from_user(col, val)
          end
        end
      else
        if @attributes.fetch_value(@primary_key) != restore_state[:id]
          @attributes.write_from_user(@primary_key, restore_state[:id])
        end
      end
```

trails' `_restoreTransactionRecordState`
(`packages/activerecord/src/transactions.ts`) makes neither call:

- the `restore_state[:attributes].map { ... with_value_from_user ... }`
  reconstruction is replaced by `_dirty.snapshot(...)` +
  `clearChangesInformation()` + `redetectChanges(...)`, which reaches the same
  `changes()` diff by a different route — hence the `map` row;
- `restoreTransactionRecordState` (the exported sibling) guards the PK restore
  with `snapshot.newRecord && !Array.isArray(this.id)`, so the
  `composite_primary_key?` arm at :480-485 — zip the key columns with the
  snapshotted id tuple and `write_from_user` each — is **not ported at all**.
  A rolled-back CPK insert therefore keeps whatever id the insert assigned
  instead of restoring the pre-transaction tuple.

The CPK gap is the substantive half; the `map` row is the shape that hides it.

## Converged shape

Port the Rails body: rebuild `@attributes` by mapping the snapshot attributes
through `with_value_from_user` when the in-memory value differs, null the two
mutation trackers, then restore the primary key with both arms — the
`composite_primary_key?` zip/`write_from_user` loop and the scalar comparison.
Keep the `force_restore_state || level <= 1` guard and the branch order.

Watch for the trails-specific reasons the current shape exists (the frozen
attribute-set unfreeze, and the ordering note about `redetectChanges` only
setting and never deleting) — those are real constraints the port has to keep
satisfying, not licence to keep the dirty-tracker route.

## Acceptance criteria

- [ ] `restoreTransactionRecordState` mirrors `transactions.rb:467-491`,
      including the `composite_primary_key?` arm.
- [ ] A regression test rolls back an insert on a composite-PK model and
      asserts the pre-transaction id tuple is restored. It must fail on
      baseline. Use the canonical CPK models/schema — no bespoke tables.
- [ ] The `restore_transaction_record_state -> map` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/activerecord/transactions.json`
      by hand and the shard tightened. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PostgreSQL and
      MySQL/MariaDB lanes green.
