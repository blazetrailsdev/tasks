---
title: "composite-pk-not-null-forcing-is-not-in-schema-rb"
status: done
updated: 2026-08-02
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: 5900
claim: "2026-08-02T18:01:29Z"
assignee: "composite-pk-not-null-forcing-is-not-in-schema-rb"
blocked-by: null
closed-reason: null
---

## Context

`TableBuilder.col` in `packages/activerecord/src/support/canonical-schema.ts:104`
forces `null: false` on every column named in a `create_table`'s composite
`primaryKey:` array:

```ts
// Composite-PK columns are NOT NULL (SQLite otherwise admits NULLs).
if (this.compositePk?.has(name)) options["null"] = false;
```

Rails does no such thing. `visit_PrimaryKeyDefinition`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:79-81`)
emits only `PRIMARY KEY (#{names})`, and the canonical schema declares the
columns bare — `vendor/rails/activerecord/test/schema/schema.rb:243-250`
(`cpk_books`) is `t.integer :author_id` / `t.integer :id` with no `null:`
option. Same for `cpk_chapters`, `carts`, and the other composite-PK tables.

So on SQLite our canonical tables carry a NOT NULL that Rails' do not. The
in-code justification is that SQLite admits NULLs in a non-INTEGER PK, so the
forcing makes SQLite agree with PG/MySQL — but that is a trails-authored
deviation reconciling adapters, not a transcription of schema.rb, and it is
undocumented as such.

Surfaced in review of PR #5704, which added `canonicalRegistrySchema` — a
declarative replay of the registry that `parity:schema` diffs against
schema.rb. That replay deliberately reports the _declared_ shape (nullable,
matching schema.rb) and guards the coincidence with
`assertCompositePkDeclaresNoNull`, so nothing silently mis-reports today; but
the underlying question of whether the DDL itself should carry NOT NULL is
untouched and belongs in its own change.

## Acceptance criteria

- Decide, against the Rails source above, whether the composite-PK `null: false`
  forcing is faithful. If it is not, remove it and let each adapter apply its
  own PK semantics, or narrow it to SQLite with a comment naming the SQLite
  behaviour it compensates for and why Rails' suite does not hit it.
- Whatever the outcome, the reason is recorded at the call site
  (`canonical-schema.ts:104`), not only in this story.
- Any test that depended on the NOT NULL (SQLite composite-PK insert of a NULL
  key) is checked against the Rails test of the same name first.
- `pnpm parity:schema` stays green, including the registry-vs-schema.rb pass
  and `assertCompositePkDeclaresNoNull`.
