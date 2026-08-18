---
title: "sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6715
claim: "2026-08-18T19:42:42Z"
assignee: "sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling"
blocked-by: null
closed-reason: null
---

## Context

`sweep-joins-call-sites-onto-the-colon-symbol-spelling` moved every
`joins` / `leftOuterJoins` association-name call site in
`packages/activerecord/src` onto the colon Symbol spelling CLAUDE.md
prescribes (`":comments"`). `includes` / `preload` / `eagerLoad` /
`references` were left on the bare spelling, so the two value sets now
disagree where Rails has Symbols on both sides.

That disagreement is currently papered over at exactly one place —
`Relation#joinedIncludesValues` (`packages/activerecord/src/relation.ts`),
Rails' `joined_includes_values` (`relation.rb:1247-1249`), which is a plain
`includes_values & joins_values` Array intersection in Ruby because both
arrays hold Symbols. The sweep PR added a colon-stripping normalization on
both sides of that intersection to keep `eager_loading?` answering the same
set; it is annotated in place as debt to be deleted once this story lands.

`WhereChain#associated` (`relation/query-methods.ts`, Rails
`query_methods.rb:88-101`) was converged in the same PR to compare
`` `:${reflection.name}` `` against `joins_values` / `left_outer_joins_values`,
which is the faithful shape — Rails compares `reflection.name`, a Symbol.
`WhereChain#missing` does not compare, so it needed no change.

## Acceptance criteria

- [ ] Every `includes` / `preload` / `eagerLoad` / `references` call site in
      `packages/activerecord/src` that passes an association NAME passes it in
      the colon spelling, including nested-hash and array forms' keys and
      values. Raw strings that name a TABLE for `references` are left as they
      are (Rails passes those as Strings).
- [ ] The colon-stripping normalization in `joinedIncludesValues` is deleted,
      collapsing it back to Rails' plain intersection.
- [ ] Preloader / JoinDependency entry points strip the leading colon exactly
      where `join-dependency.ts:933,952` already does, rather than growing new
      normalization sites.
- [ ] Generated SQL unchanged on all three adapters; no test name touched.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.

## Notes

Likely needs splitting by call-site cluster (associations tests, relation
tests, preloader tests) to stay under the LOC ceiling — the joins sweep alone
was ~660 LOC across 52 files.
