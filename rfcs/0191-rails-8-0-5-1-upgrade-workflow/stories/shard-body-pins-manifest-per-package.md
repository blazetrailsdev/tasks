---
title: "Shard body-pins.json per package, one pin per line, to stop burndown merge conflicts"
status: done
updated: 2026-11-24
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#10724
claim: "2026-11-24T21:41:17Z"
assignee: "shard-body-pins-manifest-per-package"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/body-pins.json` is one ~107k-line array, 7 lines per pin
(`package`, `rubyFile`, `rubyName`, `digest`, `ref`), sorted by
`comparePinKeys` (`scripts/api-compare/body-pins.ts:193`). Every upgrade
burndown PR runs `body-pins.ts --pin <ruby-file>`, rewriting `digest` + `ref`
on a contiguous run of records. Two agents burning down the same package or
neighbouring files edit adjacent lines, which git refuses to merge, so every
merge conflicts the other open burndown PRs. It touched 20 of ~30 merges in
the last 2 days, and 13,106 pins are still at `ref: v8.0.2` (259 at v8.0.5.2),
so the contention lasts the rest of the burndown.

Readers/writers: `scripts/api-compare/body-pins.ts`, `lint-body-pins.ts`,
`compare.ts`, `lint-bump-ledger.ts`, `baseline-json.ts` (+ test),
`scripts/parity/bump-dry-run/dry-run.ts`.

## Acceptance criteria

- The manifest is sharded per package: `scripts/api-compare/body-pins/<package>.json`;
  `body-pins.json` is deleted.
- Each shard writes one pin per line (a compact JSON object per array element),
  keeping the deterministic `comparePinKeys` order.
- `--pin`, `--pin-all`, `--prune [--package]` write only the shards they touch.
- Every reader listed above loads the shards; `lint-body-pins` duplicate-key and
  staleness checks still hold across all shards.
- `parity:api:pins` and the bump-ledger lint give identical results before and
  after (pure re-layout, no pin content change).
- Optionally apply the same one-line-per-row layout to
  `scripts/parity/bump-ledger/*.json`.
