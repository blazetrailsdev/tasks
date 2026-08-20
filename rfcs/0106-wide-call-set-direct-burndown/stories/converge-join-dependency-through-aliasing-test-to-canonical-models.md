---
title: "Move the join-dependency through-aliasing wiring tests onto canonical models and fixtures"
status: claimed
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-20T16:23:13Z"
assignee: "converge-join-dependency-through-aliasing-test-to-canonical-models"
blocked-by: null
closed-reason: null
---

# Move the join-dependency wiring tests onto canonical models and fixtures

## Context

`packages/activerecord/src/associations/join-dependency-through-aliasing.test.ts`
declares its own models and table names inline rather than using the canonical
schema — `JdtAuthor`/`JdtPost`/`JdtComment` (`jdt_authors`, `jdt_posts`,
`jdt_comments`), `MemAuthor`/`MemPost`/`MemComment`/`MemRating` (`mem_*`), and
`StjAuthor`/`StjPost`/`StjTagging`/`StjTag` which squat on the canonical
`authors` / `posts` / `taggings` / `tags` names via explicit `tableName =`
assignments while re-declaring their own attributes.

CLAUDE.md's "Canonical tables only — no bespoke tables" rule: AR tests get the
schema and fixtures through `fixtures({ ... })` and use the official models in
`packages/activerecord/src/test-helpers/models/`; table, column and model names
must match Rails exactly. Rails' own alias-tracking coverage
(`vendor/rails/activerecord/test/cases/associations/inner_join_association_test.rb`,
`.../cases/associations/join_dependency_test.rb`) uses the canonical
`Author`/`Post`/`Comment`/`Tagging`/`Tag` models against
`vendor/rails/activerecord/test/schema/schema.rb`.

The `Stj*` set is the sharpest case: it takes the canonical table names but
declares a different attribute set, so it shadows the canonical models for any
suite that shares the process.

This predates PR #6774, which only rewrote the file's assertions (off the
retired `_through_` tree nodes, onto the emitted join sources) and left the
model declarations alone.

## Converged shape

The file's three model clusters are replaced by the canonical
`Author` / `Post` / `Comment` / `Tagging` / `Tag` models from
`packages/activerecord/src/test-helpers/models/`, with the schema laid by the
existing `fixtures({})` call. The assertions keep their current shape — they
already read the emitted join sources — with the expected table names updated to
the canonical ones (`posts_authors_join`, `taggings_authors_join` are already
canonical-named in the self-join case).

Where a scenario needs an association the canonical models do not declare, add
it to the canonical model rather than minting a parallel one; if the canonical
schema genuinely lacks a table the test needs, check
`vendor/rails/activerecord/test/schema/schema.rb` first and do not invent one.

## Acceptance criteria

- [ ] No `Jdt*`, `Mem*` or `Stj*` class declarations remain in
      `join-dependency-through-aliasing.test.ts`; no inline `tableName =` /
      `attribute(...)` model definitions.
- [ ] The suite uses canonical models and the canonical schema through
      `fixtures({ ... })`.
- [ ] No canonical table name is shadowed by a locally-declared model.
- [ ] The 7 tests still pass on SQLite, PostgreSQL and MySQL/MariaDB.
