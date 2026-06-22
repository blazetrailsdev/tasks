---
title: "Un-skip named-scoping scoping-block + stats/current-scope scopes"
status: in-progress
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 250
priority: 30
pr: 3879
claim: "2026-06-22T12:51:59Z"
assignee: "unskip-named-scoping-scoping-block-and-stats-scopes"
blocked-by: null
---

## Context

`scoping/named-scoping.test.ts` (PR #3584) skips four Rails cases requiring
scope features trails lacks:

- `nested scoping` — Rails `topic.rb` `scope :nested_scoping, ->(rel) { rel.scoping { Reply.approved } }`
  relies on `relation.scoping { }` establishing `current_scope`. trails has no
  `relation.scoping { }` block form.
- `positional scope method` / `positional klass method` — Rails `topic.rb`
  `scope :scope_stats, ->(stats) { stats[:count] = count; all }` and
  `def self.klass_stats(stats); ...; end` mutate a passed hash with a sync
  `count` side-effect. trails scope bodies are async and return relations.
- `scopes honor current scopes from when defined` — Rails `post.rb`
  `ranked_by_comments` / `top` capture the association scope present at
  definition time. trails does not.

Rails source: `vendor/rails/activerecord/test/models/topic.rb`,
`.../models/post.rb`, and `.../scoping/named_scoping_test.rb`
(`test_nested_scoping`, `test_positional_scope_method`,
`test_positional_klass_method`,
`test_scopes_honor_current_scopes_from_when_defined`).

## Acceptance criteria

- [ ] Implement `relation.scoping { }` (current_scope establishment) and add the
      `nested_scoping` canonical Topic scope.
- [ ] Support positional/stats scopes faithfully (or document the async
      divergence and converge), plus the `top`/current-scope-capturing variant.
- [ ] Un-skip the four cases in `scoping/named-scoping.test.ts`.

## Definition of done

The four named cases pass un-skipped against canonical models.
