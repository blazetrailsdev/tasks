---
title: "NullPool's trap carves out ADAPTER_PROXY_PROBE_KEYS string names; Ruby raises for them"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6261
claim: "2026-08-08T20:04:41Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: null
closed-reason: null
---

## Context

`NullPool`'s `get` trap (`connection-adapters/abstract/connection-pool.ts:150-166`,
landed in #6251) raises `NoMethodError` for every non-member send, matching Ruby's
`NullPool` (`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:24-48`,
which defines a fixed member set and overrides no `method_missing`) — except that
it reads the dozen **string** keys in `ADAPTER_PROXY_PROBE_KEYS`
(`connection-pool.ts:86-110`: `then`, `catch`, `finally`, `toJSON`, `toString`,
`valueOf`, `inspect`, `asymmetricMatch`, `$$typeof`, `_isMockFunction`,
`getMockName`, `nodeType`, `nodeName`, `tagName`, …) through to `undefined`
alongside symbol keys.

Two of those (`inspect`, `to_s`) are Ruby `Object` members that Ruby's NullPool
answers too, so those two are not deviations. The rest are: `pool.then` is a
`NoMethodError` in Ruby and `undefined` here.

The carve-out exists because a NullPool is adapter state and is held by
`InternalMetadata` / `SchemaMigration` (`internal-metadata.ts:68`,
`schema-migration.ts:49`), so a vitest failure serializer walking a failing
assertion's object graph reaches one; raising from `then`/`toJSON` there replaces
the real failure with a NoMethodError from the reporter. That is a test-harness
constraint, not a language shortcoming, which is why this is a ledger row and not
a ratified deviation.

## Converged shape

Keep only the symbol-key arm — a JS `Symbol` cannot spell a Ruby send, so it is
the one carve-out the language forces. Get there by keeping serializers off the
pool rather than by making the pool answer probes: the object graph a failing
assertion serializes should not reach a bare `NullPool` (the adapter proxy's own
`ADAPTER_PROXY_PROBE_KEYS` exists for the raw-connection dispatch problem, a
different one). If a walker still reaches one, the fix is at the walker, not in
the trap.

## Acceptance criteria

- [ ] `NullPool`'s trap consults no string-key set; only `typeof prop === "symbol"`
      and `prop in target` read through.
- [ ] `pool.then` / `pool.toJSON` raise NoMethodError, as in Ruby.
- [ ] A deliberately failing assertion whose subject holds a NullPool still
      reports its own failure, not a NoMethodError from the reporter.
- [ ] No new baseline rows or allowlist entries.
