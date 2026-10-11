---
title: "activerecord: ColumnMethods defines define_column_methods once under ClassMethods, not as two statics"
status: ready
updated: 2026-10-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails PR 8773, which moved the `define_column_methods` calls into the `ColumnMethods`
modules' `[included]` hooks.

Rails defines `define_column_methods` once, under `class_methods do` of the `ColumnMethods` concern
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:331-343`):

```ruby
class_methods do
  def define_column_methods(*column_types) # :nodoc:
    column_types.each do |column_type|
      module_eval <<-RUBY, __FILE__, __LINE__ + 1
        def #{column_type}(*names, **options)
          raise ArgumentError, "Missing column name(s) for #{column_type}" if names.empty?
          names.each { |name| column(name, :#{column_type}, **options) }
        end
      RUBY
    end
  end
  private :define_column_methods
end
```

trails writes it twice in `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`,
as a static on each includer rather than on the module: `TableDefinition.defineColumnMethods`
generates a synchronous body and `Table.defineColumnMethods` an `async` one that awaits each
`this.column(...)`, because `Table#column` reaches `SchemaStatements#add_column` and is awaited.
`ColumnMethods` is a plain `Module`, not a Concern with `ClassMethods`, and its `[included]` hook
types its base as `ColumnMethodsBase` so it can call the includer's static.

## Converged shape

`ColumnMethods` is extended with `Concern` and carries
`ColumnMethods.ClassMethods = new Module((mod) => mod.defineMethod("defineColumnMethods", ...))`,
one definition, as `encryption/extended-deterministic-queries.ts` spells `CoreQueries.ClassMethods`.
The two statics on `TableDefinition` and `Table` are deleted. The generated method is one body: it
raises `ArgumentError` on empty `names`, then calls `column` per name in order. Where `column`
answers a promise the generated method has to answer one too, in order; settle that arm against
root CLAUDE.md rather than keeping two generators, and receipt it with `@inventedArm` only if it is
ratified as a language shortcoming.

## Acceptance criteria

- [ ] `defineColumnMethods` is defined once, on `ColumnMethods.ClassMethods`, and neither
      `TableDefinition` nor `Table` declares a static of that name.
- [ ] `ColumnMethodsBase` is gone or reduced to what `[included]` needs from an includer.
- [ ] `Table`'s generated column methods still run their `column` calls in order and surface a
      rejection; `migration/change-schema.test.ts` and `migration/compatibility.test.ts` stay green on
      all three adapters.
- [ ] `pnpm parity:api` still reads 100% for the three `schema_definitions.rb` files, and
      `pnpm parity:api:extra:gate` stays green.
