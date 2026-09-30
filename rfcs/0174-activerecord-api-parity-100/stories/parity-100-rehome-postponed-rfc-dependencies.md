---
title: "tasks: rehome the 34 postponed-RFC stories (0023, 0025, 0082) the parity-100 RFCs depend on"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: tooling
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 20
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFCs 0023 (surfaced deviations, retired as the catch-all), 0025 (fidelity verification tooling) and 0082
(Ruby→TS idiom conversion classes) are `postponed`. `claimable()` (`src/ranking.ts`) only surfaces a story
whose own RFC is `active`, so their drafts never reach `tasks ready`. RFCs 0172–0175 depend on 34 of
them because each already specifies a piece of the work, and re-authoring them would duplicate it. Every
story in 0172–0175 that depends on one of them also depends on this story, so the ordering is in the data,
not only in prose. Each moves to the parity-100 RFC that first depends on it:

- to `0172-arel-parity-100` (2): `arel-node-dup-missing` (0023), `arel-homogeneous-in-valuetype-vs-activemodel-type` (0025)
- to `0173-activemodel-parity-100` (5): `ruby-object-clone-dup-has-no-settled-trails-spelling` (0023), `attribute-set-fetch-value-tests-uninitialized-instead-of-yielding` (0082), `clusivity-check-validity-duck-types-delimiter` (0082), `attribute-set-to-h-alias-unported` (0082), `inline-is-mass-assignment-empty-into-assign-attributes` (0023)
- to `0174-activerecord-api-parity-100` (14): `add-constraints-guards-constraints-call-and-lambda-type` (0023), `port-promise-complete-for-async-loaded-arms` (0023), `port-insert-all-extract-types-from-columns-on` (0023), `load-from-sql-iterates-indexed-rows` (0023), `converge-shard-selector-lock-fetch` (0082), `converge-delegated-type-method-split` (0023), `pg-translate-exception-respond-to-result` (0082), `burn-down-rfc0126-repairing-surfaced-call-rows` (0023), `converge-djar-deferred-chain-walk-mode` (0023), `generated-attribute-methods-name-comes-from-const-set` (0023), `union-order-clauses-is-a-second-spelling-of-ruby-array-union` (0082), `pg-max-identifier-length-sync-async-split` (0023), `disambiguate-association-vs-collection-proxy-accessor` (0023), `port-multibyte-chars-and-string-mb-chars` (0023)
- to `0175-activerecord-test-parity-100` (13): `port-finder-aggregate-find-by-cluster` (0023), `port-finder-find-without-primary-key-onto-matey` (0023), `test-extractor-expands-hash-and-const-define-method-loops` (0025), `i18n-validation-test-uses-ad-hoc-topic-models` (0023), `database-statements-exec-insert-test` (0023), `converge-delegated-classes-onto-rails-literal-list` (0082), `port-fixtures-test-rb-fixture-declarations` (0023), `port-test-fixtures-class-attribute-declarations` (0023), `audit-load-async-surface-portability` (0023), `rational-value-quoting-analogue` (0082), `test-schema-parrots-timestamp-precision-0` (0023), `test-schema-port-parrots-toys-integer-column` (0023), `finder-find-with-string-ports-findbysql-not-string-id-cast` (0023)

`tasks rehome` commits and pushes to main, and requires the destination RFC to be merged. It therefore
runs after this PR merges, from the main tasks checkout. It lives in RFC 0174 because most of the stories
land there, but RFCs 0172, 0173 and 0175 are gated on it too.

## Acceptance criteria

- [ ] Each story above is rehomed with `tasks rehome <id...> --to <destination> --reason "parity-100 dependency"` and promoted with `tasks status-set <id> ready` unless it is blocked.
- [ ] `pnpm validate` is green on main afterwards, and the rehomed stories appear in `tasks ready --rfc <destination>`.

## Verification

```bash
pnpm tasks list --rfc 0023-surfaced-deviations --json > /tmp/z.json  # none of the ids above remain
pnpm tasks ready --rfc 0174-activerecord-api-parity-100
```
