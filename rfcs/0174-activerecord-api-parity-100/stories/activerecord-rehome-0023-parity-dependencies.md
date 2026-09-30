---
title: "tasks: rehome the retired-RFC-0023 stories the parity-100 RFCs depend on"
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

RFC 0023 is `postponed` (retired as the catch-all), so its drafts never reach `tasks ready`
(`src/ranking.ts` drops any story whose RFC is not active). RFCs 0172–0175 depend on these 0023 stories
because they already specify a piece of the work, and re-authoring them would duplicate:

- `burn-down-rfc0126-repairing-surfaced-call-rows`
- `add-constraints-guards-constraints-call-and-lambda-type`
- `port-promise-complete-for-async-loaded-arms`
- `port-insert-all-extract-types-from-columns-on`
- `load-from-sql-iterates-indexed-rows`
- `converge-delegated-type-method-split`
- `arel-node-dup-missing`
- `ruby-object-clone-dup-has-no-settled-trails-spelling`
- `generated-attribute-methods-name-comes-from-const-set`
- `pg-max-identifier-length-sync-async-split`
- `converge-djar-deferred-chain-walk-mode`
- `disambiguate-association-vs-collection-proxy-accessor`
- `inline-is-mass-assignment-empty-into-assign-attributes`
- `port-multibyte-chars-and-string-mb-chars`
- `tighten-stale-activerecord-extra-surface-marks`
- `relocate-skip-mirror-methods-to-rails-layout-files`

and, from RFC 0175, `port-finder-aggregate-find-by-cluster`, `port-finder-find-without-primary-key-onto-matey`,
`i18n-validation-test-uses-ad-hoc-topic-models`, `database-statements-exec-insert-test`,
`port-fixtures-test-rb-fixture-declarations`, `audit-load-async-surface-portability`,
`finder-find-with-string-ports-findbysql-not-string-id-cast`, `port-test-fixtures-class-attribute-declarations`,
`test-schema-parrots-timestamp-precision-0`, `test-schema-port-parrots-toys-integer-column`.

`tasks rehome` commits and pushes to main and requires the destination RFC merged, so it runs after this
RFC's PR merges, from the main tasks checkout.

## Acceptance criteria

- [ ] Each story above is rehomed with `tasks rehome <id...> --to <the parity-100 RFC that depends on it> --reason "parity-100 dependency"`, and promoted with `tasks status-set <id> ready` unless it is blocked.
- [ ] `pnpm validate` green on main afterwards; the rehomed stories appear in `tasks ready`.

## Verification

```bash
pnpm vitest run scripts/api-compare scripts/parity
```
