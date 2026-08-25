---
rfc: "0073-permanent-connection-checkout-disallowed"
title: "Ban permanent Base.connection checkout in the AR suite (helper.rb:27)"
status: draft
created: 2026-07-25
updated: 2026-07-27
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
related-rfcs:
  - "0071-ar-test-helper-suite-wide-config-fidelity"
priority: 2
---

## Summary

Set `permanentConnectionCheckout = "disallowed"` in the AR suite setup, mirroring
`vendor/rails/activerecord/test/cases/helper.rb:27`, so that a permanent
`Base.connection` checkout raises anywhere in the trails AR suite exactly as it
does in Rails. Rails' comment there states the intent plainly: "ActiveRecord::Base.connection
is only soft deprecated but we ban it from the test suite to ensure it's not
used internally."

## Motivation

trails has the flag (`ar-config.ts:126`) and a faithful, test-pinned enforcement
branch (`connection-handling.ts:485-500`, mirroring
`connection_handling.rb:274-295`, pinned by `connection-handling.test.ts:145`),
but no setup file sets it. The ban is the mechanism by which Rails keeps
`Base.connection` out of its own internals; without it, trails has no standing
guard and internal regressions land silently.

That this is a real risk is already demonstrated: the audit that motivated this
RFC (PR #5318, `docs/infrastructure/permanent-connection-checkout-disallowed-audit.md`)
found two production call sites — `core.ts` `cachedFindBy` and
`InsertAll.execute` — reading the deprecated getter where Rails wraps in
`with_connection`. Both were fixed by #5323. Neither was visible to a
`Base\.connection` grep (they spelled it `this.connection` / `model.connection`);
only instrumenting the gate found them. A permanently-armed gate is the only
reliable detector.

## Current state (measured against `main`, 2026-07-25)

Method: set the flag to `"disallowed"`, replace the `throw` with a `console.warn`
that prints the first non-internal stack frame so violations accumulate over a
whole run instead of aborting it, then run all 129 AR test files carrying a
textual `.connection`. **2077 enforcement hits.** After story A (#5349) this is **57**.

| Source                                     | Hits | Disposition                              |
| ------------------------------------------ | ---: | ---------------------------------------- |
| `model-schema.ts:41` (`reflectionAdapter`) |   11 | Story B — only remaining production site |
| test files (38 sites / 28 files)           |   46 | Story C                                  |

Story A (#5349) removed the fixture machinery as a source: `use-fixtures.ts:610`
(1983 hits), `use-transactional-tests.ts:67` (2), and the 12 helper self-test
sites that passed the thunk explicitly (32) are all now 0.

The infrastructure blockers the original audit found have mostly been fixed
under other stories since: `test-setup-dy.ts:50,65` (a boot-time blocker that
made every AR file fail at _collection_), `setup-second-pool.ts`,
`encryption/test-helpers.ts:161`, `core.ts`, `insert-all.ts`. What remains is
one fixture line, one production fallback, and a bounded test migration.

## Method (reproducing the measurement)

The numbers above are measured, not grepped. To re-run after any story lands:

1. Set `permanentConnectionCheckout = "disallowed"` in `packages/activerecord/src/cases/helper.ts`.
2. Replace the `throw` in `connection-handling.ts`'s `connection()` with a
   `console.warn` printing the first non-internal stack frame. **This step is
   required** — with the raise armed, every AR file fails at _collection_ and
   you get one violation, not an inventory.
3. Run every AR test file carrying a textual `.connection` (129 files) and
   aggregate the warned frames.
4. Revert both edits.

A textual grep is not a substitute. `Base\.connection` over the AR suite reports
114 files / 440 sites, which over-counts the tests by roughly 13× (most sites sit
behind a fixture pin and never reach the gate) _and_ misses the real defects —
the two production bugs #5323 fixed spelled it `this.connection` and
`model.connection`. Only the armed gate enumerates this accurately.

## Enforcement path

`connection-handling.ts`'s `connection()` mirrors `connection_handling.rb:274-295`
arm-for-arm: `deprecated` warns then leases, `disallowed` raises
`ActiveRecordError` with Rails' message, `true` falls through, and the
non-permanent branch returns `activeConnection`. `isPermanentLease()`
(`connection-adapters/abstract/connection-pool.ts:640`) mirrors
`permanent_lease?` (`sticky === null`). The raise is already pinned by
`connection-handling.test.ts:145`, the Rails-named test
_"#connection raises an error if ActiveRecord.permanent_connection_checkout == :disallowed"_.

The gate only fires on a _permanent_ lease, which is why the fixture pin makes
most call sites invisible to it — the same as in Rails.

## Two constraints that shape the design

These are the expensive-to-rediscover facts. Both are already paid for.

**1. `withConnection` is the wrong tool for internal call sites.** It resolves
through `connectionPool()` and raises `ConnectionNotDefined` for models backed
by a directly-assigned adapter (`Model.adapter = x`) and for HABTM join models —
precisely the cases where the deprecated getter took its `_adapter` fast path
(`connection-handling.ts:487`). Use `withPooledOrDirectConnection(modelClass, fn)`
(added by #5323), which shares `leasablePool` with `withQueryConnection` and runs
the block inline when there is no pool to lease from. This failure mode is
invisible on SQLite — the ambient `Base` pool answers and the test passes against
the _wrong database_ — and surfaces only in PG/MySQL adapter suites.

**2. The flip does not, by itself, prove internal fidelity.** Internal query
paths are wrapped in `withQueryConnection` — 5 call sites across 3 files
(`querying.ts:41,97`, `transactions.ts:102,577`, `relation/calculations.ts:1339`)
— which leases via `pool.withConnection`, making `isPermanentLease()` false;
inner `.connection` reads then return `activeConnection` and never reach the
gate. That wrap covers the query/transaction entry points, not every internal
read, so the coverage is narrow. That is
Rails-equivalent _observable_ behavior, not Rails' actual shape — Rails threads
the yielded connection and never calls `.connection` internally. This RFC locks
in current behavior and prevents regression. Converging internals onto the
threaded shape is separate, larger work (RFC 0030
`thread-yielded-connection-internal-query-path`), and is explicitly **not** in
scope here.

## Non-goals

- Threading the yielded connection through internal query paths (RFC 0030).
- Removing the `_adapter` fast path at `connection-handling.ts:487`. It
  short-circuits _above_ the flag check, so 116 `.adapter =` assignments across
  32 test files never reach the gate. This makes trails' ban narrower than
  Rails', but removing it is its own migration with its own blast radius.
- Changing the `connection()` getter's semantics. `connection-handling.test.ts:145`
  pins the raise and must keep passing.

## Plan

Four stories, strictly ordered. A and B are independently valuable and worth
shipping even if D never lands.

- **A** — route the fixture machinery off the deprecated getter (95.5% of hits).
- **B** — decide and act on `model-schema.ts:41`, the last production site.
- **C** — convert the residual test-file call sites.
- **D** — set the flag, with PG/MySQL lanes green.

## Risks

The dominant risk is the adapter lanes. Constraint 1 above means a change that
is green on SQLite can be silently wrong on PG/MySQL, and the audit's earlier
pass never executed 29 adapter-lane files at all. Every story here must run PG
and MySQL in CI before merge, not just the sqlite lane.
