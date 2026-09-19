---
title: "assertions-tail-root-3-remainder"
status: draft
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
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

Remainder of assertions-tail-root-3 (rfcs/0132-ar-closure-assertion-parity). That PR converged finder_respond_to, unsafe_raw_sql, adapter_specific_registry, reaper, date_time and quoting to 0 mismatches (2 parked: see 0155 stories finder-respond-to-dynamic-finders-invisible-to-in, quote-error-message-uses-js-constructor-name). Re-measured with `pnpm parity:test -- --package activerecord --assertions --missing`; the remaining files, Rails file under vendor/rails/activerecord/test/cases/:

- `database_configurations_test.rb` — 6 count rows (empty returns true, find db config x3, registering a custom config object, configs for with custom key) plus kind rows (truthy/instanceOf/length vs equal/notNil), incl. configs_for with include hidden.
- `relation/where_test.rb` — 5 count rows (type cast not evaluated at build time, tuple arity, where not polymorphic association / nand, subselect not two queries) plus kind rows (empty vs length, includes, nothingRaised, match).
- `encryption/encryption_schemes_test.rb` — 5 count rows plus kind rows (notNil/length/truthy vs equal).
- `database_configurations/hash_config_test.rb` — 3 count rows (default schema dump value, inspect does not show secrets, seeds defaults to primary) plus schema cache path value rows (Rails `.yml`, trails `.json` — a production divergence: park it and file a story, do not fix here).
- `timestamp_test.rb` — ~14 kind/count rows (falsy/truthy/inDelta vs equal); `no touching threadsafe` is a count row.
- `connection_handling_test.rb` — 5 count rows plus falsy/nil/truthy kind rows.

## Acceptance criteria

- Each file above reports 0 assertion-count, 0 assertion-kind and 0 assertion-value mismatches, or is parked per RFC 0132's "A converged assertion that fails is a story" rule.
- No test renames; the frozen mark file is not touched.
