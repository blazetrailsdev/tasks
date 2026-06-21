---
title: "join-model-canonical-conversion"
status: claimed
updated: 2026-06-21
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 480
priority: null
pr: null
claim: "2026-06-21T01:43:26Z"
assignee: "join-model-canonical-conversion"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/join-model.test.ts` (mirrors
`vendor/rails/activerecord/test/cases/associations/join_model_test.rb`) is
written entirely against **bespoke synthetic models** — it defines inline
`class Post`/`Tag`/`Tagging`/`Author`/etc. and per-test `defineSchema` tables
with invented prefixes (`jm_`, `cphm_`, `sphm_`, …) instead of the canonical
Rails-faithful models and fixtures. This is the antipattern RFC 0019 /
canonical-schema burndown targets: table, column, and model names do not match
Rails, so `test:compare`/`api:compare` fidelity is undermined and the 35
`it.skip` HMT tests cannot be ported faithfully.

This story converts the file to ride **only** the canonical infrastructure:

- Canonical models in `packages/activerecord/src/test-helpers/models/`
  (`Post`, `Tag`, `Tagging`, `Author`, `Category`, `Categorization`, `Comment`,
  `Item`, `Aircraft`, `Engine`, `Book`, `Citation`, `Vertex`, `Edge`, …). These
  already declare every association `join_model_test.rb` exercises
  (`Post.funkyTags`/`superTags`/`tags`/`invalidTags`/`authors`,
  `Author.comments`/`categories`, `Tagging.taggable` with `counterCache:
"tags_count"`, etc.).
- Canonical `TEST_SCHEMA` (`test-helpers/test-schema.ts`) + `useHandlerFixtures`
  with the real `posts`/`tags`/`taggings`/`authors`/`categories`/
  `categorizations`/`comments` fixtures (identities `welcome`, `thinking`,
  `david`, `mary`, `general`, `misc`, … already match Rails).
- Follow the fixture-backed handler-suite pattern in
  `associations/eager.test.ts` (the `EagerAssociationTest` HABTM blocks):
  `useHandlerFixtures([...])`, `beforeAll` `defineSchema(connection,
{…canonicalSchema}, { dropExisting: true })` to dodge cross-file shared-DB
  shape drift, `registerModel(Post)` etc.

### Why this is its own story (blocker found in PR #3405)

`registerModel` is a **global last-write-wins** registry
(`associations.ts:190` → `modelRegistry.set(name, model)`). The file's inline
synthetic `Post`/`Tag`/`Tagging`/`Author` are registered under those exact
names, and all ~90 existing non-stub tests depend on them. Importing the
canonical models into the same file overwrites those registry keys globally;
the synthetic tests then resolve `className:"Post"` to the canonical model
(whose associations reference columns like `tags_count` absent from the
synthetic `posts` schema) and break. So the conversion is **all-or-nothing for
the file** — every test must move to canonical models in one coherent change;
it cannot be done incrementally alongside the synthetic tests.

### Scope notes

- All 35 `it.skip` HMT tests should be ported faithfully (near-verbatim from
  Rails) once on canonical models; several need features that may be genuine
  gaps (counter caches, piggyback `select`, `pluralize_table_names: false`,
  eager-load `ConfigurationError` messages, string joins, abstract-parent
  eager loading, custom-PK polymorphic through). Any that still cannot pass
  without deviating from Rails behavior stay `it.skip` with `BLOCKED:` /
  `ROOT-CAUSE:` and get their own upstream-fix story — never contorted green.
- This is likely larger than one 500-LOC PR; if so, split by non-overlapping
  describe blocks across sequential PRs (ship, merge, rebase) rather than
  stacking.
- Re-land the `CollectionProxy#push`/`<<`/`concat` returns-self fidelity fix
  (Rails `collection_proxy.rb:1049`) that PR #3405 introduced and #3405's
  closure reverts — `join_model_test.rb`'s "adding to has many through should
  return self" needs it.

## Acceptance criteria

- [ ] `associations/join-model.test.ts` uses only canonical models +
      canonical `TEST_SCHEMA` + `useHandlerFixtures`; no inline synthetic
      models, no invented `defineSchema` tables. Table/column/model names match
      Rails exactly.
- [ ] The 35 listed HMT tests are un-skipped and pass (canonical SQLite, plus
      PG/MySQL where the ruby gate applies), or are reclassified to a recorded
      permanent-skip with an upstream-fix story.
- [ ] No new gate-mismatches; `test:compare`/`api:compare` delta non-negative.
- [ ] Refresh the RFC snapshot count after merge.
      </content>
