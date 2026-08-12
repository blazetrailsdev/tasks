---
title: "Converge _create_record's with_connection, attributes_with_values and id"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6429
claim: "2026-08-12T17:56:51Z"
assignee: "converge-create-record-with-connection-and-attributes-with-values"
blocked-by: null
closed-reason: null
---

## Context

Landed with PR #6418, which folded `base.ts`' `_performInsert` into
`persistence.ts#_createRecord` and retired three of the six call-set rows on
that body. Three remain in
`scripts/api-compare/call-mismatches-exclude/activerecord/persistence.json`,
each a real divergence from
`vendor/rails/activerecord/lib/active_record/persistence.rb:918-942`:

```ruby
def _create_record(attribute_names = self.attribute_names)
  attribute_names = attributes_for_create(attribute_names)

  self.class.with_connection do |connection|            # :923
    returning_columns = self.class._returning_columns_for_insert(connection)
    returning_values = self.class._insert_record(
      connection,
      attributes_with_values(attribute_names),          # :927
      returning_columns
    )
    ...
  end

  @new_record = false
  @previously_new_record = true
  yield(self) if block_given?
  id                                                    # :941
end
```

- `with_connection` — the port resolves the adapter as
  `threadedConnectionFor(ctor) ?? ctor.connection` so the INSERT does not flip
  the lease permanent. Rails' own `with_connection`
  (`connection_adapters/abstract/connection_pool.rb:405-424`) already yields the
  existing lease connection without making it permanent when one is checked out,
  so the port may be able to call it directly — that is the thing to verify.
- `attributes_with_values` — the port builds the column→value map from
  `_attributes.valuesForDatabase()`; `attributesWithValues`
  (attribute-methods.ts) returns the cast values `fetchValue` yields. Converging
  means reconciling which of the two the write path binds, not just swapping the
  call.
- `id` — Rails returns `id`; the trails chain is typed `Promise<boolean>` and
  returns `true` because `Callbacks#_create_record` reads only truthiness
  (`persistence.rb:895`, `result != false`).

## Converged shape

`_createRecord` wraps the INSERT in `ctor.withConnection(...)`, passes
`attributesWithValues.call(this, attributeNames)` to `_insertRecord`, and
returns `id`, with the chain's `Promise<boolean>` coercion moved to the layer
that actually needs a boolean.

## Acceptance criteria

- [ ] The three `_create_record` rows in `persistence.json` are deleted by hand
      (only-shrink; never `--write`).
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green with no new
      rows; `pnpm parity:api:extra --package activerecord` does not grow.
- [ ] Persistence, locking, timestamp, counter-cache and dirty suites green on
      all three lanes — the connection and serialization arms are exactly where
      an adapter-unique failure would show.
