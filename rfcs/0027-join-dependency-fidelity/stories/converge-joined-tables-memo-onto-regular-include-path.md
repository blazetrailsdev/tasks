---
title: "Extend chain-tail @joined_tables memoization to the regular (non-through) include path"
status: ready
updated: 2026-06-25
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to PR #4092 (emit-time-joined-tables-chain-tail-memoization), which
ported Rails' `JoinDependency#make_constraints` `@joined_tables` memoization
(`join_dependency.rb:193-209`) but scoped it to the through-group resolver
(`_resolveThroughGroup`) ONLY. Rails memoizes `[table, terminated]` keyed by the
remaining reflection chain for EVERY child — including plain (non-through)
includes resolved via `make_constraints` → `join_constraints`.

trails' regular single-reflection path (`_resolveChildAlias` /
`_rebuildChildJoin`, packages/activerecord/src/associations/join-dependency.ts)
does NOT read or write `_joinedTables`. So when a direct include and a through
path share a chain-tail reflection — e.g. `Author.eager_load(:posts, :comments)`
where `comments` is `has_many :comments, through: :posts` and both carry the
owner's single `posts` reflection — Rails reuses the one `posts` join, but trails
mints a second alias (`posts_authors_join`).

This divergence is currently pinned by the existing test
`join-dependency-through-aliasing.test.ts` "uses the Rails alias_candidate with
\_join when the through real name collides", which adds a direct `jdtPosts` plus a
through `jdtComments` and asserts the through link aliases to
`jdt_posts_jdt_authors_join`. Converging requires:

- `_resolveChildAlias` participating in `_joinedTables` (read+write, keyed by the
  reflection's `chain` suffix via the same `reflectionChainKey`), so a direct
  include populates/reuses the memo;
- handling the direct-include node that REUSES a through-emitted alias: it must
  still project columns + hydrate (the association IS eager-loaded) while
  suppressing the duplicate JOIN — the inverse of the through-tail suppression
  already implemented (which suppresses both join AND projection).
- updating the pinned test above to assert Rails' reuse instead of the
  `_join` divergence (read the Rails test first; do NOT rename).

## Acceptance criteria

- [ ] `make_constraints`-equivalent memoization covers the regular include path,
      not just through groups: a chain-tail reflection shared between a direct
      include and a through path (e.g. `eager_load(:posts, :comments)` through
      posts) reuses ONE alias, matching Rails (`join_dependency.rb:202-209`).
- [ ] A direct-include node that reuses a through-emitted (or earlier) alias
      still projects its columns and hydrates its association while emitting no
      duplicate JOIN.
- [ ] The pinned `_join`-divergence assertion is converged to Rails' reuse
      output; test:compare and api:compare non-negative; existing through /
      nested-through / cascaded-eager suites stay green.
