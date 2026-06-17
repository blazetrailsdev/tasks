---
title: "PG type-map lazy+defer diverges from Rails eager initialize_type_map load"
status: claimed
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 50
pr: null
claim: "2026-06-17T11:46:25Z"
assignee: "pg-typemap-eager-load-vs-lazy-defer"
blocked-by: null
---

## Context

Rails' instance `initialize_type_map` ends with a full `load_additional_types`
(vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:751),
eagerly running the 3-query reload that aliases every scalar OID and registers
all array/range/multirange types up front. trails' equivalent
`initializeInstanceTypeMap`
(packages/activerecord/src/connection-adapters/postgresql/type-map-init.ts) is a
**sync** pure function and cannot perform that async DB load, so trails relies on
**lazy, targeted** `loadAdditionalTypes([oid])` from `getOidType`
(postgresql-adapter.ts).

Because a targeted array-OID load fetches only the array row (not its element
type), the subtype OID isn't in the store and registration would silently fall
through to a `ValueType` (`.type()` → `"value"`). PR #3431 worked around this for
arrays — and an earlier change for multiranges — by **deferring** the row and
retrying after the adapter loads the element/range OID
(`deferredArrayOids`/`retryDeferredArrays`,
`deferredMultirangeOids`/`retryDeferredMultiranges` in
postgresql/oid/type-map-initializer.ts). This restores functional parity but
diverges structurally from Rails, which has no deferral path
(`register_with_subtype` simply skips on miss because the eager full load already
populated the store).

## Acceptance criteria

- [ ] Decide: either make the trails type-map build perform Rails' eager full
      `loadAdditionalTypes()` once per connection (closest to Rails, lets the
      deferral machinery be deleted), or ratify the lazy+deferral design as an
      intentional async-driven divergence and document it.
- [ ] If converging: remove `deferredArrayOids`/`retryDeferredArrays` and
      `deferredMultirangeOids`/`retryDeferredMultiranges` once eager load makes
      them dead, keeping array/range/multirange introspection green on PG.
- [ ] No regression to `schema dump allows array of decimal defaults` or the
      bigint/multirange array dump tests.
