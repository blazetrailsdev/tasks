---
title: "converge-update-delete-all-pkless-fallback-to-single-arel-path"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6602
claim: "2026-08-16T17:52:42Z"
assignee: "converge-build-arel-limit-offset-cast-value"
blocked-by: null
closed-reason: null
---

## Context

`relation.rb:606-616` (`update_all`) and `:1023-1033` (`delete_all`) ALWAYS
take the Arel path — `arel.compile_update` / `arel.compile_delete` — and branch
only on `model.composite_primary_key?` to shape `key`:

```ruby
key = if model.composite_primary_key?
  primary_key.map { |pk| table[pk] }
else
  table[primary_key]
end
```

A model with no primary key still goes through it: `table[nil]`.

`packages/activerecord/src/relation.ts` (`updateAll`, `deleteAll`) instead
gates entry to that path on the PK's SHAPE —
`typeof primaryKey === "string" || Array.isArray(primaryKey)` — and falls back
to a bespoke `new UpdateManager().table(table).set(values)` /
`new DeleteManager().from(table)` loop over
`_whereClause.predicatesWithWrappedSqlLiterals()` when the model has no
primary key. That second statement builder is a trails invention: Rails has
one code path here, not two, and the fallback silently drops the
group/having/limit/order rewrite that `compile_update` / `compile_delete`
perform (`WHERE (pk...) IN (SELECT ...)`).

Surfaced during review of PR #6599 (`inline-exec-update-delete-all-helpers`),
which inlined the statement build back into both methods per CLAUDE.md's
Decomposition rule. That PR left the shape branch untouched — it predates the
inlining and no story in the bundle asked for it. After the inline, `arel` is
already built unconditionally in both bodies, so the fallback branch is the
only remaining divergence.

## Acceptance criteria

- [ ] `updateAll` / `deleteAll` take the `compileUpdate` / `compileDelete`
      path unconditionally, as `relation.rb:606-616` / `:1023-1033` do.
- [ ] The `UpdateManager` / `DeleteManager` fallback branches are deleted; the
      `key` expression branches only on composite-vs-single PK.
- [ ] The pkless-model behaviour is pinned by a test that fails on baseline
      (check `vendor/rails/activerecord/test/` for the Rails coverage of a
      `Model.update_all` / `delete_all` on a table without a primary key
      before inventing one).
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
