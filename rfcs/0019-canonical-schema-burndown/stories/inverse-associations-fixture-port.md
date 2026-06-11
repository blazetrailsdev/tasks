---
title: "inverse-associations.test.ts → canonical Human/Face/Interest fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the blocked `associations-scope-cache-cluster`.
`associations/inverse-associations.test.ts` (~2077 LOC) stays on the
`require-canonical-schema` exclude list and needs a real fixture port — it is
NOT a mechanical schema-ref swap, and `eslint-disable` is not acceptable.

- The file invents test-local tables (`men`, `humen`, `hobbies`, `cached_men`,
  `null_men`/`null_faces`, `cpk_men`/`cpk_interests`) that exist in neither
  Rails nor `TEST_SCHEMA`. Rails `inverse_associations_test.rb` uses
  `humans`/`faces`/`interests` with a `human_id` FK + `polymorphic_human_*`
  columns; the trails port instead models `men` + `man_id`.
- Because the bodies are built around `man_id`/`man` associations, pointing
  `faces`/`interests`/`posts`/`comments` at the canonical tables (which use
  `human_id`) breaks every insert — the inline `faces: { man_id }`,
  `posts: { title }`, `comments: { body, post_id }` are exactly the
  collision-prone shapes the rule targets, so `eslint-disable` would perpetuate
  the shared-DB collision rather than fix it.

From-scratch rewrite onto canonical `Human`/`Face`/`Interest` models +
`humans`/`faces`/`interests` fixtures with `human_id`, mirroring Rails
`inverse_associations_test.rb` word-for-word. 9 `defineSchema` blocks; likely
multiple PRs.

## Acceptance criteria

- [ ] Rides `TEST_SCHEMA` + canonical `Human`/`Face`/`Interest` models +
      fixtures where Rails does; no invented `men`/`humen`/`man_id` tables.
- [ ] Test bodies match `inverse_associations_test.rb` word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; file
      removed from the exclude JSON.
