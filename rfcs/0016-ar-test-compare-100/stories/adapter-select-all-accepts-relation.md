---
title: "adapter-select-all-accepts-relation"
status: draft
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: null
deps: ["adapter-select-all-accepts-arel"]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `adapter-select-all-accepts-arel` (PR #3284), which made
adapter-level `selectAll` accept an Arel node (in addition to a SQL string) by
routing through `toSqlAndBinds`.

Rails' `select_all` accepts a third input shape: a `Relation`. Before calling
`to_sql`, it runs `binds_from_relation` (newer Rails: `arel_from_relation`),
which unwraps a `Relation` to its Arel AST + bound attributes:

```ruby
# activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb
def select_all(arel, name = nil, binds = [], preparable: nil)
  arel, binds = binds_from_relation arel, binds
  sql = to_sql(arel, binds)
  ...
end

def binds_from_relation(relation, binds)
  if relation.is_a?(Relation) && binds.empty?
    relation, binds = relation.arel, relation.bound_attributes
  end
  [relation, binds]
end
```

trails' `toSqlAndBinds` only handles string / TreeManager / Arel `Node`, not a
`Relation`. If a `Relation` is passed directly to adapter-level `selectAll` it
would hit the generic `.toSql()` branch (bypassing visitor-level bind
extraction) or throw `TypeError`. No current trails caller does this — relation
read paths call `.arel()` upstream before reaching the adapter — so this is a
latent Rails-parity gap, not an active bug. Surfaced in review of PR #3284.

## Acceptance criteria

- Adapter-level `selectAll` (and the shared `toSqlAndBinds` / cached entry
  point) unwraps a `Relation` to its Arel AST + bound attributes before
  compiling, mirroring Rails' `binds_from_relation` / `arel_from_relation`
  (only when the explicit `binds` argument is empty, per Rails).
- A test passes a `Relation` directly to `conn.selectAll(relation)` and gets the
  expected rows, matching the corresponding Rails behavior.
- String and Arel-node inputs remain unchanged.
