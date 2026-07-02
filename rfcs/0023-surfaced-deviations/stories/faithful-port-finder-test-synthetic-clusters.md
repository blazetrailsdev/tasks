---
title: "Faithfully port finder.test.ts synthetic clusters onto real finder_test.rb models/fixtures"
status: claimed
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-07-02T16:45:53Z"
assignee: "faithful-port-finder-test-synthetic-clusters"
blocked-by: null
closed-reason: null
---

## Context

PR #4401 converged `packages/activerecord/src/finder.test.ts` off its bespoke
`as const` `defineSchema` schema onto the canonical `TEST_SCHEMA` (removing the
`require-canonical-schema-exclude.json` entry). To stay in scope and keep the
250+ tests green, the post-line-174 clusters were converged at the _schema_
level only: the synthetic inline models now ride canonical tables/columns, but
they remain thin ad-hoc coverage rather than faithful ports of the real Rails
`finder_test.rb` tests. Several column choices are cosmetic substitutions that
keep the assertion working without matching the Rails source:

- `posts.author`/`status` string usages → `posts.body` (finder.test.ts makeModel
  cluster + "find by on attribute that is a reserved word" originally on
  `status`; now on `topics.group`).
- `posts.score` (integer) → `posts.author_id` ("find by bang on relation with
  large number", "custom select takes precedence over original value").
- The `users.name` test ("find_by returns nil if the record is missing") → a
  local `class Topic` on `topics.title`.
- Many `class Topic`/`class Post extends Base` inline models with `{ default: "" }`
  on `title`/`body` are generic and don't map to a named Rails test.

The file header (finder.test.ts:19-25) documents this: the ordinal-finder
cluster (take/sole/first/second/third) is a faithful canonical port; the rest
ride the canonical schema but need faithful porting.

## Acceptance criteria

- [ ] Map each post-line-174 `describe("FinderTest")` test to its real
      `finder_test.rb` counterpart (vendor/rails/activerecord/test/cases/finder_test.rb)
      and port it onto the canonical `Topic`/`Post`/`Comment` models + real
      fixtures, matching Rails column semantics (not cosmetic substitutions).
- [ ] Drop synthetic tests that have no `finder_test.rb` counterpart, or replace
      them with the genuine Rails test they were approximating (test names must
      match Rails verbatim once ported).
- [ ] Remove the "thin ad-hoc coverage" caveat from the finder.test.ts header
      once the file is a faithful port.
- [ ] No bespoke schema regressions; `blazetrails/require-canonical-schema`
      stays clean.

Likely larger than one 500-LOC PR — split into tranches by Rails cluster
(fourth/fifth/\*-to-last, exists, find-by, conditions) if needed.
