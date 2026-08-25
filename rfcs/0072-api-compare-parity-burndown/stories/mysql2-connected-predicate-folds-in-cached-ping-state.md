---
title: "mysql2-connected-predicate-folds-in-cached-ping-state"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5966
claim: "2026-08-03T13:14:00Z"
assignee: "mysql2-connected-predicate-folds-in-cached-ping-state"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while reviewing `extra-surface-mysql2-and-libsql-per-file-singletons`
(PR #5947), which tagged `Mysql2Adapter#activeAsync`
`@noRailsEquivalent PERMANENT` because the name cannot be converged onto Rails'
`active?` today. Two underlying fidelity gaps block that convergence.

**1. `isConnected()` folds in `_activeState`, which Rails' `connected?` does not.**

Rails (`mysql2_adapter.rb:104`):

```ruby
def connected?
  !(@raw_connection.nil? || @raw_connection.closed?)
end

def active?
  if connected?
    @lock.synchronize { if @raw_connection&.ping ... }
  end || false
end
```

`connected?` asks only whether the raw handle exists and is open. `active?` is
`connected?` **plus** a live ping. trails'
`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`
`isConnected()` additionally requires `this._activeState` — the cached
ping result — so after a failed ping trails reports `isConnected() === false`
where Rails' `connected?` still reports true (the handle is present and not
closed). The Rails-exact split is:

- `isConnected()` → `_client !== null && !_permanentlyClosed && !_isFakeConnection`
- `active` → `isConnected() && _activeState`

This preserves the `active ⟹ isConnected` invariant the existing in-file comment
defends, while making `connected?` mean what Rails means. PR #5947 already made
`active` delegate to `isConnected()` (the bodies were byte-identical), so the
remaining change is dropping `_activeState` from `isConnected()` and re-adding it
to `active`.

**2. `active` is a sync getter, so the ping half needs a second name.**

Rails' `active?` pings inline because the Ruby mysql2 driver blocks. node-mysql2's
`ping()` returns a promise, so trails splits the method into the sync `active`
getter and the async `activeAsync` probe — the name PR #5947 had to tag. Removing
the tag means making `active` awaitable, which is a package-wide flip: `get active()`
is declared in 7 places (`abstract-adapter.ts:1104`, `postgresql-adapter.ts:238`,
`sqlite3-adapter.ts:288`, `mysql2-adapter.ts`, `support/fake-adapter.ts`, plus two
test doubles) with ~72 call sites, including sync consumers in
`abstract/transaction.ts:822` and `abstract-adapter.ts:1325`. That is its own
change and must not ride along with a surface-naming PR.

## Acceptance criteria

- `isConnected()` matches Rails' `connected?` exactly: raw-handle presence only,
  no `_activeState` term. `active` becomes `isConnected() && _activeState`.
- A regression test that fails on baseline: after a failed ping flips
  `_activeState` false, `isConnected()` stays true while `active` goes false.
  Verify it red before the fix (per the repo's regression-test rule).
- Decide and record whether the `active` sync→async flip is worth it. If yes,
  scope it as its own follow-up story with the 7 declarations + 72 call sites
  enumerated; if no, replace `activeAsync`'s PERMANENT tag reason with the
  recorded decision.
- `pnpm parity:api:extra --package activerecord` reports no new novel surface or STALE
  tags.
- MySQL lane green (needs a running server; CI covers it).
