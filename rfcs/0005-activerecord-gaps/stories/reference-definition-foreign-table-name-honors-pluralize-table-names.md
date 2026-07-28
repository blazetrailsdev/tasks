---
title: "reference-definition-foreign-table-name-honors-pluralize-table-names"
status: in-progress
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5489
claim: "2026-07-28T12:22:16Z"
assignee: "reference-definition-foreign-table-name-honors-pluralize-table-names"
blocked-by: null
closed-reason: null
---

## Context

`ReferenceDefinition#foreignTableName`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:796-799`)
unconditionally pluralizes the reference name:

```ts
private foreignTableName(): string {
  const fkOpts = this.foreignKeyOptions();
  return fkOpts.toTable ?? pluralize(this.name);
}
```

Rails' `foreign_table_name`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:293-297`)
gates the pluralization on the `pluralize_table_names` flag:

```ruby
def foreign_table_name
  foreign_key_options.fetch(:to_table) do
    Base.pluralize_table_names ? name.to_s.pluralize : name
  end
end
```

So with `Base.pluralizeTableNames = false`, `t.references :user, foreign_key: true`
(and `addReference` / `changeTable`'s `t.references`, which now all route through
`ReferenceDefinition` after PR #5485) emits a foreign key pointing at `users`
instead of `user`, against a table that does not exist.

The flag is otherwise honored consistently in trails:

- `packages/activerecord/src/base.ts:4395` — `static pluralizeTableNames = true`
- `packages/activerecord/src/reflection.ts:595`
- `packages/activerecord/src/model-schema.ts:141,173`
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2293` —
  already does the correct `Base.pluralizeTableNames ? pluralize(inferred) : inferred`
  for the analogous inferred-to-table case, so this is an isolated miss.

Found during review of PR #5485 (which made `add_reference` a delegate to
`ReferenceDefinition`). The line is untouched by that diff, so it was left out
of scope there. Note that the fix now has wider blast radius than before #5485:
`foreignTableName` is the single shared implementation for `create_table`'s
`t.references`, `change_table`'s `t.references`, and top-level `add_reference`.

## Acceptance criteria

- [ ] `foreignTableName` reads `Base.pluralizeTableNames` and returns the bare
      name when it is false, mirroring `schema_definitions.rb:293-297`.
- [ ] An explicit `toTable` in `foreignKeyOptions` still wins, matching Ruby's
      `fetch(:to_table) { ... }` block-default semantics.
- [ ] Regression coverage that fails on baseline: with
      `Base.pluralizeTableNames = false`, a `references` with `foreignKey: true`
      targets the singular table. Restore the flag in teardown — it is global
      state on `Base`.
- [ ] `api:compare --package activerecord` and
      `test:compare --package activerecord` deltas are non-negative;
      `test:compare --gates --check` exits 0.
- [ ] Existing suites stay green: `migration/`,
      `connection-adapters/abstract/`, `invertible-migration`.
