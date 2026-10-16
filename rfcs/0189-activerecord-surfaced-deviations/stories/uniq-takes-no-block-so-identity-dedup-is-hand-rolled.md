---
title: "ruby-compat: uniq takes no block, so Rails' uniq(&:__id__) sites hand-roll identity de-duplication"
status: draft
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: [ruby-compat, activerecord]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails de-duplicates records by object identity with a block `uniq`, in two places:

- `Transaction#unique_records` is `records.uniq(&:__id__)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:336-338`).
- `Preloader::Association#initialize` sets `@owners = owners.uniq(&:__id__)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/preloader/association.rb:106`).

ruby-compat's `uniq(ary)` (`packages/ruby-compat/src/array.ts:985`) takes no block. In MRI, `rb_ary_uniq` (`vendor/ruby/v3.3.11/array.c:6177`) keys each element on the block's result when a block is given (`ary_make_hash_by`) and keeps the first element for each key.

Because of that, both trails sites hand-roll the de-duplication with a `Set`:

- `uniqueRecords()` (`packages/activerecord/src/connection-adapters/abstract/transaction.ts:521-531`) keeps the Rails name, but calls neither `uniq` nor `__id__`.
- `Preloader::Association`'s constructor calls `this._uniqueOwners(owners)` (`packages/activerecord/src/associations/preloader/association.ts:36`). That is a private helper (`:268-275`) Rails does not have.

`__id__` is ruby-compat's `rbObjId` (`packages/ruby-compat/src/object.ts:1286`).

## Acceptance criteria

- [ ] ruby-compat's `uniq` takes an optional block. With a block, it keys on the block's result through the same `rbHash` / `rbEql` buckets and keeps the first element for each key, citing `array.c:6177`. Unit tests cover a block whose keys collide and one whose keys do not.
- [ ] `uniqueRecords()` is `uniq(this.records, (r) => rbObjId(r))`.
- [ ] `Preloader::Association`'s constructor sets `owners` to `uniq(owners, (o) => rbObjId(o))`, and `_uniqueOwners` is deleted.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` show no new row. Any row this converges is deleted by hand.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:extra:gate && pnpm vitest run packages/ruby-compat/src/array packages/activerecord/src/connection-adapters/abstract/transaction packages/activerecord/src/associations/preloader
```
