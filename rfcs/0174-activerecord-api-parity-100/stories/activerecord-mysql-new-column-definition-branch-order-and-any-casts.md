---
title: "mysql new_column_definition: branch order, the type local and the any-cast option writes"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MySQL::TableDefinition#new_column_definition`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/schema_definitions.rb:66-80`):

```ruby
def new_column_definition(name, type, **options) # :nodoc:
  case type
  when :virtual
    type = options[:type]
  when :primary_key
    type = :integer
    options[:limit] ||= 8
    options[:primary_key] = true
  when /\Aunsigned_(?<type>.+)\z/
    type = $~[:type].to_sym
    options[:unsigned] = true
  end

  super
end
```

The port (`packages/activerecord/src/connection-adapters/mysql/schema-definitions.ts:72-92`) tests
`primary_key` before `virtual`, renames the local to `resolvedType`, and writes the options through
`(options as any)`, spelling `options[:limit] ||= 8` as
`(options as any).limit = (options as any).limit ?? 8`. `??` also differs from `||=` for a stored
`false`.

## Acceptance criteria

- [ ] The branches are in Rails' order (`virtual`, `primary_key`, the `unsigned_` match), the local is `type`, and the three option writes go through the typed `options` with no `any` cast.
- [ ] `options[:limit] ||= 8` keeps Ruby truthiness (a stored `nil` or `false` takes 8).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/connection-adapters/abstract/schema-definitions.trails.test.ts
```
