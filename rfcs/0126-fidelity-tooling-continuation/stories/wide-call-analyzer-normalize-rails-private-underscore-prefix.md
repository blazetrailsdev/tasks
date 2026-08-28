---
title: "Wide call analyzer: normalize the Rails-private _ prefix on callee names"
status: ready
updated: 2026-07-27
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Found in #5343 (`extra-surface-schema-cache-and-pool-sync-api`,
2026-07-26). The wide call analyzer matches a Rails callee name against the
TS callee name, but does not normalize the repo's Rails-private `_` prefix.
A Rails private method ported as `_foo` therefore **matches as a method**
(parity:api counts it) but **never matches as a call** — every body that
calls it is reported as omitting the call Rails makes.

Proven concretely on `ConnectionPool#connection_lease`
(`connection_pool.rb:711`, private). Before #5343 the file carried a hollow
free function `connectionLease(pool)` whose entire body was
`pool._connectionLease()`, purely so the name matched, while the nine real
call sites used `this._connectionLease()`. Six baseline entries existed
solely because of the prefix:

    checkin -> connection_lease
    lease_connection -> connection_lease
    permanent_lease? -> connection_lease
    pin_connection! -> connection_lease
    release_connection -> connection_lease
    with_connection -> connection_lease

Renaming the live private method to `connectionLease` converged all six at
once. Deleting the shim without renaming instead drops
`connection_pool.rb` from 70/70 to 69/70 — direct evidence the matcher
sees `_connectionLease` and `connection_lease` as unrelated.

The `_` prefix is a documented repo convention (`collectTsFileNames` in
`scripts/api-compare/extra-surface.ts` filters it as Rails-private), so
the extra-surface side already understands it and the call side does not.
Every Rails-private ported as `_foo` across the codebase is likely
contributing the same false entries.

## Acceptance criteria

- Quantify first: count baseline entries in
  `call-mismatches-wide-exclude/` whose `call` matches an existing TS
  member with a `_` prefix. That number is the size of the win.
- Normalize the `_` prefix in the wide call analyzer's callee comparison,
  the same way `collectTsFileNames` already does for surface.
- Re-run `pnpm parity:api --wide-calls` and remove every entry that goes
  stale (the baseline only shrinks).
- Guard against the inverse: a TS `_foo` must not match a Rails call named
  `_foo` that is genuinely distinct from `foo`. Add a test for both
  directions.
- No change to `parity:api` method match counts.

## Re-verified 2026-08-17 (ready sweep)

Re-express against the merged `call-mismatches-exclude/` tree and
`lint-call-mismatches.ts` (RFC 0084 folded the wide analyzer in). The
underscore-normalisation question itself is unaffected by the fold.
