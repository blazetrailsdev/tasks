---
title: "Serve rails-tests.json from the cross-worktree shared cache"
status: done
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6276
claim: "2026-08-09T02:45:47Z"
assignee: "migration-context-collaborator-readers-cast-away-the-null-object"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/orchestrate.ts` consults a content-keyed cross-worktree
shared cache before running the Ruby extractor (`runRubyExtractShared`,
`railsCacheKey`, `railsOutputFresh`, backed by `scripts/api-compare/shared-cache.ts`),
so a sibling worktree that already extracted the same vendored Rails serves
`output/rails-api.json` from disk instead of re-running Ruby.

`scripts/test-compare/orchestrate.ts` (added by #6266) has no equivalent: it
always spawns `ruby extract-ruby-tests.rb`, which is the dominant cost of a
full `pnpm parity:test` (~25s of the measured 30.8s warm run). With many
agents each holding a worktree, every one of them re-pays it.

## Acceptance criteria

- `output/rails-tests.json` is served from the shared cache on a hit, keyed on
  the content of `vendor/sources.lock.json`, `vendor/sources.ts` and
  `extract-ruby-tests.rb` (the test-compare analogue of `RAILS_INPUTS`).
- A miss runs Ruby and publishes the result for sibling worktrees.
- `TEST_COMPARE_FORCE=1` bypasses the cache, mirroring `API_COMPARE_FORCE`.
- Reuses `scripts/api-compare/shared-cache.ts` rather than adding a second
  implementation.
- Comparison output unchanged; wall-clock improvement measured in the PR body.
