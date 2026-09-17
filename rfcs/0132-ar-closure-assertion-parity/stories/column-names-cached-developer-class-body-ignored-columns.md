---
title: "column-names-cached-developer-class-body-ignored-columns"
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

Rails' test model
`vendor/rails/activerecord/test/models/developer.rb:374-377`:

```ruby
class ColumnNamesCachedDeveloper < ActiveRecord::Base
  self.table_name = "developers"
  self.ignored_columns += ["name"] if column_names.include?("name")
end
```

`base_test.rb:1844-1846` ("when assigning new ignored columns it invalidates
cache for column names") asserts `name` is not in `column_names`. The class body
reads `column_names` (a synchronous schema reflection in Ruby), which caches it,
and the `ignored_columns=` write then has to invalidate that cache.

trails' port (`packages/activerecord/src/test-helpers/models/developer.ts`,
`ColumnNamesCachedDeveloper`) sets only `tableName`. The conditional
`ignoredColumns` write is missing. It cannot run in a static block as written:
the schema is cold at module evaluation, so `columnNames()` peeks an empty cache
(CLAUDE.md § "Schema reflection peeks at a warm cache").

`packages/activerecord/src/base.test.ts` carries this test as `it.skip`,
pointing at this story.

## Acceptance criteria

- `ColumnNamesCachedDeveloper` reproduces Rails' order: the column names are
  read and cached first, then the `ignored_columns` write invalidates the cache.
  This must also hold when the schema is cold at class definition.
- `base.test.ts` › "when assigning new ignored columns it invalidates cache for
  column names" is un-skipped and passes.
