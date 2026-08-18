---
title: "sweep-remaining-includes-preload-call-sites-onto-the-colon-symbol-spelling"
status: closed
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
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
closed-reason: "Duplicate: superseded by the pre-existing converge-includes-preload-colon-sweep-* cluster family (associations-eager-test, associations-remainder, src-top-level, relation-and-preloader), which was filed first and already covers the same call-site inventory."
---

## Context

`sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling` swept the
correctness-critical slice: every `includes` / `preload` / `eagerLoad` call site
that intersects `joins_values` (so `Relation#joinedIncludesValues`,
`relation.ts`, could collapse back to Rails' plain
`includes_values & joins_values` intersection, `relation.rb:1247-1249`), plus
the core wiring — `Preloader::Branch#_normalizeAssociationName`
(`associations/preloader/branch.ts`, Rails `branch.rb:11-18`'s `to_sym`) and
`Merger`'s reflection-keyed nesting (`relation/merger.ts:138,141`).

~354 association-name call sites remain on the bare spelling, dominated by
`packages/activerecord/src/associations/eager.test.ts` (224 of them). These are
purely a spelling sweep now — the consumers already strip the leading colon at
`join-dependency.ts:933,952` and `branch.ts`.

Split it by file cluster to stay under the LOC ceiling; `eager.test.ts` alone is
one PR.

## Acceptance criteria

- [ ] Every remaining `includes` / `preload` / `eagerLoad` call site in
      `packages/activerecord/src` that passes an association NAME passes it in
      the colon spelling, including nested-hash and array keys and values.
- [ ] Generated SQL unchanged on all three adapters; no test name touched.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
