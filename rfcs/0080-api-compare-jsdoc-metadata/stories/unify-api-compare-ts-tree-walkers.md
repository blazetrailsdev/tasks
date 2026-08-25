---
title: "unify-api-compare-ts-tree-walkers"
status: done
updated: 2026-07-30
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5679
claim: "2026-07-30T21:15:18Z"
assignee: "unify-api-compare-ts-tree-walkers"
blocked-by: null
closed-reason: null
---

## Context

PR #5674 extracted `listTsFiles(dir)` out of `listSourceFiles` so the two JSDoc
lints (`parity:api:reasons`, `parity:api:detached`) share one declaration of the `.ts` scope
rules. Review of that PR flagged that a third walker still overlaps in purpose.
Auditing the tree, there are in fact **four** independent `.ts` tree-walkers in
`scripts/api-compare/`:

- `lint-missing-rails-call-reasons.ts:29` — `listTsFiles(dir)`, async
  (`fs/promises`, `readdir({ recursive: true })`), skips `node_modules`/`dist`,
  **includes** `*.test.ts`. Shared with `lint-detached-jsdoc-tags.ts` via
  `listLintedFiles`.
- `extract-ts-api.ts:2561` — `getAllTsFiles(dir, excludeDirs)`, exported, sync
  (`fs.existsSync` + `fs.readdirSync`), recursive by hand, takes **full-path**
  `excludeDirs`, and **excludes** `*.test.ts` and `*.d.ts`. Callers:
  `extract-ts-api.ts:258`, `extract-ts-api.ts:409`.
- `lint-deps.ts:556` — a private `getAllTsFiles(dir)`, byte-for-byte the same
  body as the next one, no `excludeDirs` param. Caller: `lint-deps.ts:305`.
- `lint-calls.ts:181` — a private `getAllTsFiles(dir)`, an exact duplicate of
  the `lint-deps.ts` one. Caller: `lint-calls.ts:80`.

The last two are pure copy-paste duplicates of each other and are trivially
collapsible into the exported `extract-ts-api.ts` one (same filter, same
semantics, they just omit the optional `excludeDirs` argument).

The `listTsFiles` / `getAllTsFiles` split is **not** trivially collapsible and
should probably survive as two named populations, because the difference is
semantic and deliberate — documented at
`lint-missing-rails-call-reasons.ts:29-32`: the lints police _what is
committed_ (so `*.test.ts` counts), while the extractor measures _what
api-compare compares against Rails_ (so tests and `.d.ts` are out). Collapsing
them into one function with a pile of boolean flags would be a regression in
clarity. The win is (a) deleting the two exact duplicates and (b) making the
two surviving walkers share a single traversal primitive with the
include/exclude policy passed in, so the sync/async split and the
`excludeDirs`-is-full-paths quirk stop being per-file surprises.

Note the sync/async divergence is a real constraint, not an oversight:
api-compare's hard rules require async fs in the lint scripts, while
`getAllTsFiles` is called from synchronous extractor code paths (including
worker threads). Any unification has to keep a sync entry point or refactor
those call sites.

## Acceptance criteria

- `lint-deps.ts` and `lint-calls.ts` no longer define private `getAllTsFiles`
  duplicates; they use one shared implementation.
- The committed-vs-compared population distinction stays legible (either two
  named wrappers, or an explicit policy argument — not a boolean soup).
- `parity:api:reasons`, `parity:api:detached`, `parity:api:extra`, `parity:api` and `parity:api:deps` all
  report identical counts before and after (behaviour-preserving refactor).
- Tests cover the shared walker's include/exclude policy for both populations.
- No new third-party deps; async-fs hard rule preserved in the lint scripts.
