---
title: "retire-missing-rails-call-fetch-receipts"
status: in-progress
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 41
pr: 7330
claim: "2026-09-01T12:03:02Z"
assignee: "converge-argument-error-onto-ruby-compat-activesupport"
blocked-by: null
closed-reason: null
---

## Context

Split out of `retire-no-js-call-form-entries-and-fetch-receipts` (RFC 0129) under
that story's own "larger than one PR" clause. That PR shipped the
`NO_JS_CALL_FORM` half — `key?` / `has_key?` deleted from the table
(`scripts/api-compare/compare.ts`) and all 37 surfaced rows converged onto
`@blazetrails/ruby-compat`'s `hasKey` — and left the `@missingRailsCall fetch`
half, which is a second, independent population.

**Measured 2026-08-31: 28 `@missingRailsCall fetch` receipts across
`packages/*/src`**, 370 `@missingRailsCall` receipts in total. The 28:

- `packages/activerecord/src` (24): `reflection.ts`, `result.ts`,
  `associations/belongs-to-association.ts`, `associations/has-one-association.ts`,
  `associations/has-many-association.ts`, `database-configurations/hash-config.ts`
  (×5), `connection-adapters/abstract/schema-definitions.ts` (×2),
  `connection-adapters/abstract-adapter.ts` (the one `CONVERGEABLE` row, pointing
  at `abstract-adapter-constructor-drops-rails-config-arg`),
  `connection-adapters/abstract/schema-statements.ts` (×2),
  `connection-adapters/sqlite3-adapter.ts` (×2),
  `connection-adapters/abstract-mysql-adapter.ts`, `middleware/shard-selector.ts`,
  `relation/calculations.ts` (×3), `type/hash-lookup-type-map.ts`
- `packages/activesupport/src` (4): `actionable-error.ts`, `json/encoding.ts`,
  `message-pack/serializer.ts`, `number-helper/number-to-delimited-converter.ts`,
  `number-helper/rounding-helper.ts`

Each was defensible when RFC 0106's `audit-missing-rails-call-permanence-claims`
(done, #6855) reviewed them, because no callable TS `fetch` existed. RFC 0129's
`Hash#fetch` (`packages/ruby-compat/src/hash.ts`, the port of `rb_hash_fetch_m`,
`vendor/ruby/hash.c:2176`) is that call form, so the premise the `PERMANENT`
claim rests on is gone. `port-hash-fetch-semantics-validate-and-seeds` (done,
#6673) is the behavioural reference for the two-arm semantics.

A receipt is retired **by making the call**, never by rewording it. `fetch` is
listed in `AMBIGUOUS_RUBY_CALLS` (`scripts/parity/ruby-compat.ts:60`) because
`ActiveSupport::Cache::Store#fetch` and `Array#fetch` are also `fetch`, so
ruby-compat's export does NOT auto-credit through `jsEnumerableAliases` — check
each site's Ruby receiver is a Hash before converting, and leave a receipt whose
reason is genuinely something else.

## Acceptance criteria

- Every `@missingRailsCall fetch` receipt whose Ruby call is a `Hash#fetch` and
  whose TS site can call `@blazetrails/ruby-compat`'s `fetch` is retired by
  making the call; the PR body reports the before/after receipt count.
- Any receipt left in place has a reason that is not "no JS call analogue" —
  a non-Hash receiver, or a call the site genuinely does not make; the PR body
  lists them.
- Rows surfaced by a retired receipt are converged, or baselined with a reviewed
  per-row reason — sorted, via `serializeBaseline`, no reseed.
- `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` and
  `parity:api:params` all green.
- If 28 sites is more than one PR, ship a package at a time and file the
  remainder with the measured count — do not fan out sibling PRs.
