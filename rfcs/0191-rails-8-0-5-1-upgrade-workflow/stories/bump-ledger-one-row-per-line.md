---
title: "Write the bump ledger one row per line to stop burndown merge conflicts"
status: ready
updated: 2026-11-25
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10724 split `scripts/api-compare/body-pins.json` into per-package shards
with one pin per line (`serializeShard`, `scripts/api-compare/body-pins.ts`),
so parallel burndown PRs stop conflicting. The bump ledger has the same shape
and the same contention: `scripts/parity/bump-ledger/<source>.json` is written
by `saveLedger` (`scripts/api-compare/bump-ledger.ts:65`) through
`serializeBaseline`, several lines per row. Every `body-pins.ts --pin` deletes
the ledger rows it cleared, so two burndown PRs on neighbouring files edit
adjacent lines of `rails.json` and conflict. This is the optional last
acceptance criterion of `shard-body-pins-manifest-per-package`, which was not
done there.

## Acceptance criteria

- Ledger files (`<source>.json`, `.tests.json`, `.stories.json`) are written
  one compact row per line, in the existing `comparePinKeys` order. Consider
  sharding `rails.json` per package as the body pins are.
- Every reader of the ledger (`loadLedgers`, `lint-bump-ledger.ts`'s
  `showJson` base/head reads, `bump-dry-run`) reads the new layout.
- `baseline-json.test.ts` checks the new form; the files go in `.prettierignore`.
- The ledger lint and `parity:api:pins` give identical results before and after.
