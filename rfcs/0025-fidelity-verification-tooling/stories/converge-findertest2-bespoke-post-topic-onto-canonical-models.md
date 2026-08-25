---
title: "converge-findertest2-bespoke-post-topic-onto-canonical-models"
status: done
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5274
claim: "2026-07-24T22:22:53Z"
assignee: "converge-findertest2-bespoke-post-topic-onto-canonical-models"
blocked-by: null
closed-reason: null
---

## Context

Left over from PR #5246 (`converge-sibling-test-bespoke-registermodel-canonical-shadows`),
which armed the `registerModel` canonical-shadow guard in `finder.test.ts` by
importing `test-helpers/canonical-model-index.js`.

The guard is green there because every `registerModel` call in the file already
passes a canonical class. But the ad-hoc `FinderTest2` block
(`packages/activerecord/src/finder.test.ts`, the `describe("FinderTest")`
around :1505) still declares bespoke `class Post extends Base` /
`class Topic extends Base` locals with hand-declared `attribute()` calls over
the canonical `posts`/`topics` tables. They never reach `registerModel`, so the
guard cannot see them, but they are the same latent shadow: the moment one of
those tests resolves an association target by name it will get the wrong class.

Rails source: `vendor/rails/activerecord/test/cases/finder_test.rb` —
`find by empty in condition`, `find with nil inside set passed for one
attribute` and the neighbouring tests ride the canonical `Topic`/`Post` models
with `fixtures :topics, :posts`.

## Acceptance criteria

- Converge the `FinderTest2` bespoke `Post`/`Topic` locals onto the canonical
  models in `test-helpers/models/`, riding the canonical fixtures rather than
  `create`-ing rows where Rails uses fixtures.
- Do NOT rename any test.
- `finder.test.ts` stays green; the canonical-model-index import stays.
