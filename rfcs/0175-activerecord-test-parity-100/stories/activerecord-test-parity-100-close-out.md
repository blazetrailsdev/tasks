---
title: "activerecord: verify every test-side parity axis at 100% and pin each gate at zero"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: closeout
packages: ["activerecord"]
deps:
  [
    "parity-100-rehome-postponed-rfc-dependencies",
    "activerecord-port-finder-test-find-by-cases",
    "activerecord-port-finder-test-remaining-cases",
    "activerecord-port-database-tasks-per-adapter-cases",
    "activerecord-port-i18n-validation-uniqueness-and-associated-cases",
    "activerecord-port-model-and-association-missing-cases",
    "activerecord-port-adapter-and-migrator-missing-cases",
    "activerecord-unskip-relation-delegation-tests",
    "activerecord-unskip-remaining-matched-skips",
    "activerecord-range-test-describe-path-and-misplaced-find-by",
    "activerecord-assertion-kind-and-value-residue-to-zero",
    "activerecord-relocate-ts-only-tests-root-part-1",
    "activerecord-relocate-ts-only-tests-root-part-2",
    "activerecord-relocate-ts-only-tests-relation",
    "activerecord-relocate-ts-only-tests-adapters-postgresql",
    "activerecord-relocate-ts-only-tests-encryption",
    "activerecord-relocate-ts-only-tests-associations",
    "activerecord-relocate-ts-only-tests-connection-adapters",
    "activerecord-relocate-ts-only-tests-smaller-dirs",
    "activerecord-port-thread-excluded-tests-pool-and-cache",
    "activerecord-port-thread-excluded-tests-transactions-and-scoping",
    "activerecord-port-marshal-excluded-tests",
    "activerecord-port-yaml-excluded-tests",
    "activerecord-port-fixtures-test-excluded-cases-files-and-paths",
    "activerecord-port-fixtures-test-excluded-cases-lifecycle",
    "activerecord-port-visibility-and-symbol-excluded-tests",
    "activerecord-audit-autoload-and-constant-lookup-excluded-tests",
    "activerecord-port-async-query-excluded-tests",
    "activerecord-port-misc-excluded-tests",
    "activerecord-delete-dead-invented-schema-tables",
    "activerecord-converge-clients-firms-invented-tables-onto-companies",
    "activerecord-converge-targets-invented-table",
    "activerecord-converge-remaining-invented-tables",
    "activerecord-fixture-parity-diffs-and-unported-fixture-schemas",
    "activerecord-burn-no-standalone-associations-exclude",
    "activerecord-burn-canonical-rebuild-and-row-write-excludes",
    "activerecord-burn-expected-fixtures-and-fixture-parity-excludes",
    "port-remaining-migration-compatibility-test-cases",
    "rails-test-name-parity-rollout-activerecord",
    "flip-assertion-mismatch-gate-to-hard-zero",
    "test-schema-parrots-timestamp-precision-0",
    "test-schema-port-parrots-toys-integer-column",
    "port-finder-aggregate-find-by-cluster",
    "finder-find-with-string-ports-findbysql-not-string-id-cast",
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The last story of RFC 0175. Re-measure (`pnpm parity:test`, `parity:test:assertions`, `parity:fixtures`,
`parity:schema`) and record the final table against the RFC's § "Baseline". Blocked residue named in the
table rather than depended on: `activerecord-fork-excluded-tests` (no process fork), the trilogy cases
(`activerecord-port-trilogy-adapter`, RFC 0174), and the three access-control cases while
`activerecord-private-attribute-methods-are-still-public` is blocked.

## Acceptance criteria

- [ ] `pnpm parity:test` activerecord: 100% of scored tests, 0 skipped (3 while blocked), 0 wrong describe, 0 misplaced, 0 extra, 353/353 files.
- [ ] `assertion-mismatch-mark.json` activerecord 0/0/0; `pnpm parity:fixtures` diff 0, schema 143/143, erb-allowed 0; `pnpm parity:schema` baselined 0, option divergences 0, shape warnings 0.
- [ ] The unported register holds no activerecord test entry except ratified § "Trails has no autoloader" cases and the blocked fork/trilogy rows.
- [ ] The four eslint/test registers above hold no activerecord entry.

## Verification

```bash
pnpm build && pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:pins && pnpm parity:api:receipts:gate && pnpm parity:test && pnpm parity:test:assertions
```
