---
title: "Lay the canonical authors -> author_addresses foreign key (schema.rb:100)"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/schema/schema.rb:100` lays the first of the
file's two standalone foreign keys:

```ruby
add_foreign_key :authors, :author_addresses, deferrable: :immediate
```

PR #7129 (`lessons-students-canonical-foreign-key`) landed the _second_ one
(schema.rb:726, `lessons_students -> students`) into both transcriptions and
taught `ForeignKeySpec` / `schema-file-generator.ts` / `describeForeignKey` the
`onDelete` and `deferrable` fields it needed. This one is still absent:

- `packages/activerecord/src/support/canonical-schema.ts` — the
  `await define("authors", ...)` block declares `author_address_id` and its
  index but no `t.foreignKey`.
- `packages/activerecord/src/test-helpers/test-schema.ts` — the `authors`
  entry carries `indexes:` but no `foreignKeys:`.

The plumbing is already in place, so this is the transcription plus its blast
radius.

## Converged shape

Inside the `authors` block, mirroring PR #7129's `lessons_students`:

```ts
t.foreignKey("author_addresses", {
  column: "author_address_id",
  deferrable: "immediate",
});
```

`author_addresses` is already defined ahead of `authors`
(canonical-schema.ts:421 vs :423), so no reordering is needed here — unlike
`lessons_students`, whose `students` had to be hoisted.

## Blast radius to check

With the constraint live, any suite inserting an `authors` row whose
`author_address_id` names a missing `author_addresses` row starts failing on
PG/MySQL. The `authors` fixtures and every `Author.create` in the association
suites are the consumers to sweep. Rails runs the same suites with this FK in
place, so a failure is a fixture/test gap, not a reason to drop the FK.

## Acceptance criteria

- [ ] `canonical-schema.ts` and `test-helpers/test-schema.ts` both lay
      `add_foreign_key :authors, :author_addresses, deferrable: :immediate`
      (schema.rb:100).
- [ ] `pnpm parity:schema` clean (`transcription-drift=0`).
- [ ] AR suites green on SQLite, PG and MySQL/MariaDB.
- [ ] No test renames; `parity:test` delta non-negative.
