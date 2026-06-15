---
title: "construct: handle no-primary-key nodes via join_primary_key (id=nil, skip caching)"
status: done
updated: 2026-06-15
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3324
claim: "2026-06-15T02:45:09Z"
assignee: "construct-no-primary-key-join-primary-key-branch"
blocked-by: null
---

## Context

Rails' `JoinDependency#construct`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:255`)
has two branches for deriving the per-node identity key from a result row:

```ruby
if node.primary_key
  keys = Array(node.primary_key).map { |column| aliases.column_alias(node, column) }
  id   = keys.map { |key| row[key] }
else
  keys = Array(node.reflection.join_primary_key).map { |column| aliases.column_alias(node, column.to_s) }
  id   = keys.map { nil }   # Avoid id-based model caching.
end

if keys.any? { |key| row[key].nil? }
  ar_parent.association(node.reflection.name).loaded!   # nil association
  next
end

unless model = seen[ar_parent][node][id]
  model = construct_model(ar_parent, node, row, model_cache, id, strict_loading_value)
  seen[ar_parent][node][id] = model if id
end
```

The **no-primary-key branch** (a joined model with no PK, e.g. a join/HABTM
record or a view) keys identity off `reflection.join_primary_key` columns but
deliberately sets `id = [nil, ...]` so the row is **not** cached in `seen` /
`model_cache` (`seen[...][id] = model if id` is skipped). trails' row
reconstruction (the `construct`/instantiate path in
`packages/activerecord/src/associations/join-dependency.ts`) does not implement
this branch — it assumes every node has a primary key, so a no-PK joined node
would mis-key or wrongly dedupe via the cache.

The sibling story `converge-instantiate-construct` (PR #3272, **merged**) already
introduced the `instantiateFromRows` / `_constructRecursive` / `applyColumnAliases`
trio mirroring Rails' `instantiate`/`construct`/`construct_model`. This story is
the no-PK sub-branch of that `construct` — the prerequisite has landed, so this
is unblocked and edits the existing trio directly.

## Acceptance criteria

- [ ] The TS `construct` equivalent handles a node whose `primaryKey` is absent
      by deriving keys from `reflection.joinPrimaryKey`, setting the identity id
      to nils, and **skipping** insertion into the `seen` / model cache (mirror
      `id = keys.map { nil }` + `seen[...][id] = model if id`).
- [ ] The nil-association short-circuit (any key column null → mark the
      association `loaded!` and skip) is preserved for both branches.
- [ ] An eager-load test over a no-primary-key joined model (read the Rails
      `join_model`/HABTM eager cases for the exact scenario, mirror names
      verbatim) reconstructs correctly without spurious dedupe.
- [ ] CI green on all three adapters; api:compare / test:compare delta
      non-negative.
