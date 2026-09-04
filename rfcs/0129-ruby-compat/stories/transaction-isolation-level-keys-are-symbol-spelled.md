---
title: "transaction-isolation-level-keys-are-symbol-spelled"
status: in-progress
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7479
claim: "2026-09-04T12:02:12Z"
assignee: "transaction-isolation-level-keys-are-symbol-spelled"
blocked-by: null
closed-reason: null
---

## Context

`abstract_mysql_adapter.rb:235` builds its isolation statement with a
`Hash#fetch` on a **Symbol** key:

```ruby
"SET TRANSACTION ISOLATION LEVEL #{transaction_isolation_levels.fetch(isolation)}"
```

so a bad level raises `KeyError: key not found: :read_committed` — Ruby's
`rb_hash_fetch_m` describes the missing key with `rb_inspect(key)`
(`vendor/ruby/hash.c:2200`), and `Symbol#inspect` writes the colon back
(`vendor/ruby/symbol.c` `sym_inspect`).

trails spells those keys WITHOUT the leading colon:
`transactionIsolationLevels()` in
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:536-543`
returns `{ read_uncommitted: …, read_committed: …, repeatable_read: …,
serializable: … }`. That contradicts the repo-wide convention in CLAUDE.md —
a Ruby Symbol is a JS string that KEEPS its colon (`":read_committed"`) — and
it is what keeps the `@missingRailsCall fetch — PERMANENT` receipt at
`connection-adapters/abstract-mysql-adapter.ts:417` alive: routing that site
through `@blazetrails/ruby-compat`'s `fetch` today would emit
`key not found: "read_committed"` where Rails emits `key not found: :read_committed`.
The site currently hand-rolls the raise to preserve the message.

Surfaced while retiring the other `fetch` receipts in #7403; deliberately left
out of that PR because the key spelling has to converge first.

## Converged shape

`transactionIsolationLevels()` returns Symbol-spelled keys
(`":read_uncommitted"` … `":serializable"`), its callers look up with the
Symbol spelling, and `beginIsolatedDbTransaction` becomes the plain call:

```ts
const level = fetch<string>(transactionIsolationLevels(), isolation);
```

with the `@missingRailsCall fetch` receipt deleted and the settled
`@missingRailsArgs fetch — PERMANENT` receipt added for ruby-compat's
receiver-as-first-argument shape.

## Acceptance criteria

- [ ] `transactionIsolationLevels()`'s keys carry the leading colon, per
      CLAUDE.md's Symbol convention, and every caller is updated —
      `beginIsolatedDbTransaction` in the abstract, mysql and postgresql
      adapters, and `transaction.ts`'s isolation validation.
- [ ] `abstract-mysql-adapter.ts` `beginIsolatedDbTransaction` calls
      ruby-compat's `fetch`; its `@missingRailsCall fetch` receipt is deleted.
- [ ] A test pins the KeyError message as `key not found: :bogus`, matching
      Rails. (`adapters/postgresql/postgresql-adapter.trails.test.ts:1067`
      already asserts that exact string for the pg path — it must keep passing.)
- [ ] `pnpm parity:api:calls` and `:args` show no new rows; the receipt count
      for `fetch` in `activerecord` drops by one.
