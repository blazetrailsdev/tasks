---
title: "isSharedCache carries a driver-capability guard Rails does not have, and five skipped cases"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`sqlite3-issharedcache-sniffs-filename-not-open-flags` (trails#7554) replaced a
filename sniff with Rails' actual predicate, but could not land it clean, and
this is the residue.

Rails is a pure config read:

```ruby
def shared_cache? # :nodoc:
  @config.fetch(:flags, 0).anybits?(::SQLite3::Constants::Open::SHAREDCACHE)
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:472-474`).
That is honest in Ruby because `rb:35` hands the same options hash — `:flags`
included — to `SQLite3::Database.new`, which honours it, so config and
connection cannot disagree.

They can in trails. No sqlite driver the repo ships exposes raw open flags:
better-sqlite3 and libsql take `{readonly, fileMustExist, timeout, verbose,
nativeBinding}`, `node:sqlite` takes `readOnly`, expo-sqlite takes neither, and
none sets `SQLITE_OPEN_URI`. So `openConfig()`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) hands the
flags over and every driver drops SHAREDCACHE.

Two deviations follow, both shipped in #7554 and both wanting removal:

1. **`isSharedCache()` carries a guard Rails does not have** — a
   `SqliteDriverCapabilities.sharedCache` mask ahead of the Rails read
   (`sqlite3-adapter.ts`, `sqlite-adapter.ts`). Without it the predicate reports
   a shared cache for a connection that has none, which is the false positive
   the filename sniff produced, one layer up — and it guards
   `internal_begin_transaction`'s "You need to enable the shared-cache mode"
   raise (`sqlite3/database_statements.rb:68`), so a false positive there sets
   `PRAGMA read_uncommitted=ON` on a connection that cannot honour it.
2. **Four more Rails cases are skipped**, on top of the one
   `sqlite3-read-uncommitted-shared-cache-skip` already tracks. All of
   `transaction_test.rb`'s shared-cache cases now have no reachable true arm:
   `shared_cached? is true when cache-mode is enabled` (`:6`), and the three
   `read_uncommitted` PRAGMA cases at `:60`, `:74` and `:87`.

`sqlite3-read-uncommitted-shared-cache-skip` (blocked) records the same driver
limit but is scoped to ONE test, `opens a read_uncommitted transaction`
(`transaction_test.rb:42`). This story is its widened residue and should be
closed with it, not before it.

## Converged shape

When any trails sqlite driver gains a flags or URI surface — the blocker on the
sibling story — the mask goes away entirely and `isSharedCache()` becomes Rails'
one-line body verbatim:

```ts
isSharedCache(): boolean {
  return anybits(fetch(this._config, "flags", 0), SQLite3Constants.Open.SHAREDCACHE);
}
```

`SqliteDriverCapabilities.sharedCache` is then deleted from the seam and from
all four drivers, and the five `it.skip`s in
`packages/activerecord/src/adapters/sqlite3/transaction.test.ts` are unskipped
together.

Do NOT close this by keeping the mask and writing a better justification for it:
it is a guard Rails does not have, and it exists only because the driver cannot
honour a flag it is handed.

## Acceptance criteria

- [ ] `isSharedCache()` is Rails' `sqlite3_adapter.rb:472-474` body with no
      capability guard ahead of it.
- [ ] `SqliteDriverCapabilities.sharedCache` is gone from `sqlite-adapter.ts`
      and from all four driver modules.
- [ ] All five shared-cache `it.skip`s in `transaction.test.ts` run and pass,
      including `opens a read_uncommitted transaction` from the sibling story.
- [ ] `scripts/parity/unported-files/baseline.json`'s driver-limit register for
      this file shrinks rather than being reworded.
