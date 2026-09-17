---
title: "canonical-schema-references-follow-adapter-type"
status: draft
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
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
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/base_test.rb:166-171`
(`test_primary_key_and_references_columns_should_be_identical_type`) asserts
`Author.columns_hash["id"].sql_type == Post.columns_hash["author_id"].sql_type`.

Rails' schema declares `t.references :author` for `posts`
(`vendor/rails/activerecord/test/schema/schema.rb:972-973`). On SQLite,
`SQLite3::TableDefinition#references` forces `type: :integer`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/schema_definitions.rb:14-16`),
so the column matches the `integer PRIMARY KEY` id. On PG/MySQL it stays
`bigint`, matching a bigint primary key.

trails' canonical schema has no `references` column helper. It expands every
Rails `t.references` into `t.bigInteger(...)`
(`packages/activerecord/src/support/canonical-schema.ts`, e.g. the `posts` table:
`t.bigInteger("author_id")`). On SQLite, `posts.author_id` therefore reflects
`bigint` against an `INTEGER` id, and the ported test reds.

`packages/activerecord/src/base.test.ts` carries this test as `it.skip`,
pointing at this story.

## Acceptance criteria

- The canonical schema DSL has a `references` / `belongsTo` column helper that
  follows each adapter's `TableDefinition#references` (integer on SQLite, bigint
  elsewhere), and the tables schema.rb declares with `t.references` use it.
- `base.test.ts` › "primary key and references columns should be identical type"
  is un-skipped and passes on every adapter lane.
