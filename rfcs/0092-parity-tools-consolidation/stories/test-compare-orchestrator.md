---
title: "Port test-compare/run.sh to a single-process orchestrate.ts"
status: done
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps:
  - extract-parity-tools-package
deps-rfc: []
est-loc: 250
priority: null
pr: 6266
claim: "2026-08-09T00:22:09Z"
assignee: "test-compare-orchestrator"
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/run.sh` is the bash pipeline shape
`scripts/api-compare/run.sh` migrated away from: it spawns
`pnpm -s vendor:fetch`, `ruby extract-ruby-tests.rb`,
`pnpm tsx extract-ts-tests.ts`, and `pnpm tsx test-compare.ts` as separate
processes (~1.7s tsx cold start each, per api-compare's run.sh header), with
an ad-hoc `--cached` flag handled in bash that skips extraction when
`output/rails-tests.json` + `output/ts-tests.json` exist.

Port it to `scripts/test-compare/orchestrate.ts` modeled on
`scripts/api-compare/orchestrate.ts` (186 lines): one tsx process running
fetch → ruby-extract ∥ ts-extract → compare, with `TEST_COMPARE_FORCE` env
semantics mirroring `API_COMPARE_FORCE`. Keep `--cached` accepted as an alias
during transition. Preserve the `vendor:fetch --print-test-paths` JSON
handoff to `extract-ruby-tests.rb` via `TEST_PATHS_JSON`, and pass-through of
`--package`, `--missing`, `--json`, `--incomplete`. `run.sh` shrinks to the
same 3-line delegate api-compare's is.

## Acceptance criteria

- `pnpm parity:test` runs the full pipeline in a single tsx process; output
  deltas exactly zero vs before.
- `--cached` / `TEST_COMPARE_FORCE` semantics: cached run skips extraction
  when both manifests exist, falls back to full run otherwise.
- `pnpm parity:test:stubs` (which chains `parity:test -- --missing --json`) still
  works.
- Wall-clock improvement measured and noted in the PR body.
