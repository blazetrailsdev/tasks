---
title: "quoted_include_columns is duplicated onto abstract SchemaCreation, where Rails has none"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7534, which gave `quotedIncludeColumns` Rails' Symbol / String /
Array arms. The reviewer confirmed the arms are right but flagged the host as
pre-existing extra surface.

Rails defines `quoted_include_columns` **only** on PostgreSQL
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_creation.rb:143-145`):

```ruby
def quoted_include_columns(o)
  String === o ? o : quoted_include_columns_for_index(o)
end
```

The abstract `SchemaCreation` merely CALLS it
(`abstract/schema_creation.rb:118`):

```ruby
sql << "INCLUDE (#{quoted_include_columns(index.include)})" if supports_index_include? && index.include
```

so on a non-PostgreSQL adapter that line is unreachable — `supports_index_include?`
is false everywhere else — and the method genuinely does not exist there.

trails defines it on the abstract class
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts`) as
a `protected` member with a full three-arm body, which PostgreSQL's
`SchemaCreation` then overrides
(`postgresql/schema-creation.ts`). The abstract copy is a
name Rails has no counterpart for on that file, and its body is a duplicate of
the PostgreSQL one — so the Symbol/String/Array logic now lives twice, and the
next change to it has two sites to keep in step.

The same shape applies to `quotedIncludeColumnsForIndex`, whose PostgreSQL
`SchemaCreation` copy
(`postgresql/schema-creation.ts`) is a fallback for a
`conn` that does not implement the adapter method — Rails has no such fallback,
because `quoted_include_columns_for_index` is defined unconditionally on
`PostgreSQL::SchemaStatements` (`postgresql/schema_statements.rb:944-951`) and
the visitor's `conn` is always a PostgreSQL adapter.

## Converged shape

Delete the abstract `quotedIncludeColumns` and let the name exist only on
`PostgreSQL::SchemaCreation`, matching `schema_creation.rb:143-145`. The
abstract `visitCreateIndexDefinition` keeps its call, which is Rails'
`schema_creation.rb:118` — TypeScript needs the callee to be declared somewhere
the abstract class can see, so the settled options are an abstract/optional
member declaration with no body, or narrowing the call to the PostgreSQL
subclass the way the Ruby unreachability already implies.

Then drop the `typeof host.quotedIncludeColumnsForIndex === "function"` fallback
in `postgresql/schema-creation.ts` and call the adapter method directly, since
`PostgreSQL::SchemaStatements` always answers it.

Both deletions lower `parity:api:extra`'s `moved`/`total` for activerecord;
tighten with `pnpm parity:api:extra:tighten`, never up.

## Acceptance criteria

- [ ] `quotedIncludeColumns` has exactly one definition, on
      `PostgreSQL::SchemaCreation`, matching schema_creation.rb:143-145.
- [ ] The Symbol/String/Array discrimination exists in exactly one place.
- [ ] The `quotedIncludeColumnsForIndex` host-optionality fallback is gone.
- [ ] `pnpm parity:api:extra:gate` reports activerecord's `total` DOWN.
- [ ] No test renames; PG lane green.
