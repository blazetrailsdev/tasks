---
title: "retire-missing-rails-call-fetch-receipts-activerecord"
status: draft
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `retire-missing-rails-call-fetch-receipts` (RFC 0129) under that
story's own "larger than one PR" clause. That PR retired 10 of the measured 28
`@missingRailsCall fetch` receipts — the four Hash-receiver sites in
`activesupport` (`actionable-error.ts`, `json/encoding.ts`,
`number-helper/number-to-delimited-converter.ts`,
`number-helper/rounding-helper.ts`), the five in
`activerecord/src/database-configurations/hash-config.ts`, and
`activerecord/src/middleware/shard-selector.ts` — by making the call against
`@blazetrails/ruby-compat`'s `fetch` (the port of `rb_hash_fetch_m`,
`vendor/ruby/hash.c:2176`).

**17 remain, all in `activerecord`** (measured 2026-09-01):

- `result.ts:258` (`columnType`)
- `reflection.ts:759` (`inverseName`)
- `type/hash-lookup-type-map.ts:110` (`performFetch`) — Map receiver
- `relation/calculations.ts:837,998,1024`
- `connection-adapters/abstract/schema-definitions.ts:277,771`
- `connection-adapters/abstract/schema-statements.ts:1322,1731`
- `connection-adapters/sqlite3-adapter.ts:821,1840`
- `connection-adapters/abstract-mysql-adapter.ts:417`
- `connection-adapters/abstract-adapter.ts:717` — the one `CONVERGEABLE` row,
  pointing at `abstract-adapter-constructor-drops-rails-config-arg`

Plus one deliberately KEPT in `activesupport`:
`message-pack/serializer.ts:58`, whose Ruby is `ENV.fetch("RAILS_MAX_THREADS", 5)`
— an `ENV` receiver, not a Hash, and a thread count JS has nothing to read.
That one is settled; do not reopen it.

Two shapes recur among the 17 and each needs its own decision, not a blanket
conversion:

- a **Map/registry receiver** (`hash-lookup-type-map.ts`,
  `type/hash-lookup-type-map`'s `_mapping`) — `ruby-compat`'s `fetch` takes a
  `Record<string, unknown>`, so a `Map` site is not a call it can make as-is;
- a **memoization idiom** (`reflection.ts` `inverseName`, `result.ts`
  `columnType`), where the TS body reads a cache field rather than a Hash.

Retiring by making the call is the only close; rewording a receipt is not.

Note the receiver-shape cost the first PR surfaced: `ruby-compat`'s `fetch`
takes the Hash Ruby calls it ON as its first argument, so every converted call
site carries one argument more than the Ruby and `parity:api:calls:args` flags
it. The settled receipt is a `@missingRailsArgs fetch — PERMANENT` tag at the
call site (see `packages/activesupport/src/actionable-error.ts`), not a
baseline row.

## Acceptance criteria

- Every remaining `@missingRailsCall fetch` receipt whose Ruby call is a
  `Hash#fetch` and whose TS site can call `@blazetrails/ruby-compat`'s `fetch`
  is retired by making the call; the PR body reports the before/after count.
- Any receipt left in place has a reason that is not "no JS call analogue" — a
  non-Hash receiver, or a call the site genuinely does not make; the PR body
  lists them.
- Rows surfaced by a retired receipt are converged, or baselined with a
  reviewed per-row reason — sorted, via `serializeBaseline`, no reseed.
- `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` and
  `parity:api:params` all green.
