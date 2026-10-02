---
title: "activerecord: assume_migrated_upto_version raises RuntimeError and keeps Rails' versions local"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#assume_migrated_upto_version` raises with a bare string, so the class is
`RuntimeError`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1378-1380`):

```ruby
if (duplicate = inserting.detect { |v| inserting.count(v) > 1 })
  raise "Duplicate migration #{duplicate}. Please renumber your migrations to resolve the conflict."
end
```

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts#assumeMigratedUptoVersion`
throws a plain JS `Error`. ruby-compat exports `RuntimeError` (`packages/ruby-compat/src/runtime-error.ts`),
which is what a `rescue RuntimeError` / `rescue StandardError` port matches on.

The same body computes `inserting` as `allVersions.filter((v) => v < version && !migrated.includes(v))`
where Rails writes `(versions - migrated).select { |v| v < version }`, and names Rails' `versions`
local `allVersions`.

## Converged shape

`throw new RuntimeError(...)` with the same message; the local is `versions`; `inserting` is the
array difference then the select, in Rails' order.

## Acceptance criteria

- [ ] The duplicate-migration raise is a `RuntimeError`, with a test asserting the class.
- [ ] The local is named `versions` and `inserting` mirrors `(versions - migrated).select { ... }`.
