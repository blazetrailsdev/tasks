---
title: "Port CallbackChain#empty? so has_transactional_callbacks? stops counting entries"
status: closed
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Work landed: hasTransactionalCallbacks reads chain.isEmpty on main via PR #6741 (credited to the sibling bakeoff story callback-chain-empty-predicate-bakeoff-sonnet); this duplicate claim has no PR."
---

# `has_transactional_callbacks?` counts chain entries instead of asking `empty?`

## Context

Surfaced while converging `transactions.json`'s `kind: "set"` rows in PR #6737
(RFC 0106 wave 4c). One of the 5 rows left in that shard.

Rails:

```ruby
# vendor/rails/activerecord/lib/active_record/transactions.rb:518-520
def has_transactional_callbacks?
  !_rollback_callbacks.empty? || !_commit_callbacks.empty? || !_before_commit_callbacks.empty?
end
```

trails (`packages/activerecord/src/transactions.ts`, `hasTransactionalCallbacks`)
now checks all three chains in Rails' order, but spells emptiness as
`chain.entries.length > 0` because `peekCallbackChain`
(`packages/activesupport/src/`) hands back the raw chain object and there is no
`CallbackChain#empty?` to call. So the row stays:

```text
transactions.ts  has_transactional_callbacks?  ->  empty?
```

Rails' `CallbackChain#empty?` is `activesupport/lib/active_support/callbacks.rb`
(`def empty?; @chain.empty?; end` on `CallbackChain`).

## Converged shape

Port `CallbackChain#empty?` onto trails' chain object, then write the three
arms as `!chain.isEmpty()` (the `?`→`isX` spelling from
docs/ruby-ts-conventions.md). Retire the baseline row by hand via
`serializeBaseline` and tighten `activerecord/transactions.json`. Check whether
any other caller of `peekCallbackChain` is doing the same `entries.length`
dance and converge those in the same pass.

## Acceptance criteria

- [ ] `CallbackChain#empty?` exists on the trails chain object at the
      conventions-mandated name.
- [ ] `hasTransactionalCallbacks` calls it for all three chains, keeping Rails'
      short-circuit order (rollback, commit, before_commit).
- [ ] The `has_transactional_callbacks? -> empty?` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/activerecord/transactions.json`
      by hand and the shard tightened. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PostgreSQL and
      MySQL/MariaDB lanes green.
