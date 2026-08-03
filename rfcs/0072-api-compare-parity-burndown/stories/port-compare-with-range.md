---
title: "port-compare-with-range"
status: ready
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

`ActiveSupport::CompareWithRange#===` (core_ext/range/compare_range.rb:16) has no TS port at all: `packages/activesupport/src/core-ext/range/` does not exist. The method-order manifest already carries a bucket for the (nonexistent) `packages/activesupport/src/core-ext/range/compare-range.ts` with `["isInclude","include","includes"]`, so the file is expected but unported.

Because there is no TS member, `===` cannot be pinned in `OPERATOR_SPELLING_BY_FQN` (`scripts/api-compare/operator-order-spelling.ts`). Discovered while pinning module-level operator spellings (story `module-level-operator-spellings-unpinned`).

## Acceptance criteria

- [ ] Port `core_ext/range/compare_range.rb` (`===` plus the `include?` / `cover?` surface the manifest bucket already expects) to `packages/activesupport/src/core-ext/range/compare-range.ts`, mirroring Rails' range-vs-range semantics.
- [ ] Add the verified `===` entry to `OPERATOR_SPELLING_BY_FQN` with the `file:line` comment the table uses.
- [ ] Tests named verbatim after the Rails tests in `vendor/rails/activesupport/test/core_ext/range_ext_test.rb`.
