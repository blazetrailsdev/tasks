---
title: "cache-increment-decrement-seed-on-miss-converge"
status: in-progress
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3851
claim: "2026-06-22T00:06:42Z"
assignee: "cache-increment-decrement-seed-on-miss-converge"
blocked-by: null
---

## Context

`FileStore.modifyValue` and `MemoryStore.modifyValue` (and the bespoke tests
`cache.test.ts:95` "increment returns null for missing key") return `null` when
`increment`/`decrement` is called on a key that is unset, expired, or
version-mismatched. Rails diverges:

`file_store.rb:222-241` (and `memory_store.rb#modify_value`):

```ruby
if !entry || entry.expired? || entry.mismatched?(version)
  write(name, amount, options)   # seeds the key set to amount
  amount
else
  num = entry.value.to_i + amount
  entry = Entry.new(num, expires_at: entry.expires_at, version: entry.version)
  write_entry(key, entry)
  num
end
```

So Rails `cache.increment("foo") # => 1` on an unset key (documented at
`file_store.rb:48-50`), and a version-stale entry is discarded and re-seeded to
`amount` rather than incremented. trails currently:

- returns `null` on the miss/expired path instead of seeding `amount`, and
- omits the `mismatched?(version)` branch entirely (only `isExpired()` is
  checked) in `FileStore.modifyValue`
  (`packages/activesupport/src/cache/file-store.ts`).

This is a pre-existing cross-store deviation, NOT introduced by the FileStore
Entry-storage convergence (PR #3850); it predates it in both
`memory-store.ts:230-238` and the old FileStore body. The Rails "increment
unset key" / "decrement unset key" tests are currently `it.skip` in
`stores/mem-cache-store.test.ts:16,20`.

## Acceptance criteria

- `MemoryStore.modifyValue` and `FileStore.modifyValue` seed an unset/expired/
  version-mismatched key to `amount` and return `amount`, mirroring Rails
  `modify_value` (write the key, return the seeded value).
- Both `modifyValue` paths add the `mismatched?(normalizeVersion(...))` guard so
  a version-stale entry is re-seeded, not incremented.
- Convert the bespoke `cache.test.ts` "increment returns null for missing key"
  (and the MemoryStore/FileStore null-on-miss expectations) to the Rails
  seed-on-miss behavior, and un-skip the Rails "increment unset key" /
  "decrement unset key" tests in `stores/mem-cache-store.test.ts` where they
  apply to MemoryStore/FileStore.
- NullStore stays null (it has no backing store — `null_store.rb`).
- api:compare / test:compare delta non-negative.
