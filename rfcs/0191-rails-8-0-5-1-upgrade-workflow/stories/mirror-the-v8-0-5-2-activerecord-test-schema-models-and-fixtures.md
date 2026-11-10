---
title: "Mirror the v8.0.5.2 activerecord test schema, models and fixtures in the canonical test schema"
status: draft
updated: 2026-11-10
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1 "What 8.0.5.2 adds". Between `v8.0.2` and `v8.0.5.2` (identical
at `v8.0.5.1`) the activerecord test schema, models and fixtures change in 11
files, +88/-10 (`git diff --stat v8.0.2 v8.0.5.2 -- activerecord/test/schema
activerecord/test/models activerecord/test/fixtures`):

- `activerecord/test/schema/schema.rb`: `authors` gains
  `t.integer :published_author_id` (after `owned_essay_id`, `:92-95` at
  `v8.0.5.2`); new `create_table :book_identifiers, id: :integer`
  (`book` reference, `id_type`, `id_value` not null); new
  `create_table :cpk_posts_tags` (`post_title`, `post_author`, `tag_id`).
- `activerecord/test/schema/postgresql_specific_schema.rb` (+17/-10).
- Models: `author.rb` (+7), new `book_identifier.rb`, `car.rb` (+6), `cpk.rb`,
  `cpk/chapter.rb`, `cpk/post.rb`, new `cpk/posts_tag.rb`.
- Fixtures: new `book_identifiers.yml`, `cpk_posts.yml` (+12).

The trails mirror has none of it: `packages/activerecord/src/test-helpers/test-schema.ts:94-102`
(`authors`) stops at `owned_essay_id`, and there is no `book_identifiers` or
`cpk_posts_tags` table, `book-identifier.ts` model or `cpk/posts-tag.ts`.
The new Rails tests that use them are ported by the burn-down RFC; this story
lands the canonical schema so they can (CLAUDE.md § "Canonical tables only").

## Acceptance criteria

- [ ] `test-schema.ts` mirrors the three `schema.rb` changes at
      `vendor/rails/v8.0.5.2/activerecord/test/schema/schema.rb`, with Rails'
      column order, types and `null: false`.
- [ ] The PostgreSQL-specific schema delta is mirrored wherever trails mirrors
      `postgresql_specific_schema.rb`, or the PR body shows trails does not
      and names the story that owns it.
- [ ] The seven model files and two fixture files are mirrored in
      `packages/activerecord/src/test-helpers/models/` and `fixtures/`,
      names matching Rails.
- [ ] Schema Parity and the fixtures-and-models comparison are green on the
      PR.
- [ ] Each existing test file that loads `authors` or `cpk_*` runs green
      locally (`pnpm vitest run <file>`), on SQLite at least.

## Definition of done

No new test is ported here, and no bespoke table is added.
