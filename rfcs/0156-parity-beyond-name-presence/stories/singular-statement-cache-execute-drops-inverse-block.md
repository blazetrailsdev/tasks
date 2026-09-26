---
title: "find_target's statement-cache execute drops the set_inverse_instance/set_strict_loading block"
status: draft
updated: 2026-09-26
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
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

trails#8116 gave `StatementCache#execute` its block (`statement_cache.rb:145`), forwarded to
`find_by_sql`. The one production caller still omits it. That caller is `_loadSingularViaStatementCache`
in `packages/activerecord/src/associations.ts`: `sc.execute(binds, c, { allowRetry: true })`.

Rails `Association#find_target` (`activerecord/lib/active_record/associations/association.rb:263-273`)
passes the block at the same call:

```ruby
klass.with_connection do |c|
  sc.execute(binds, c, async: async) do |record|
    set_inverse_instance(record)
    set_strict_loading(record)
  end
end
```

So a singular association loaded through the statement-cache path never has its inverse set
or its strict-loading applied per record at instantiation time.

## Acceptance criteria

- The `sc.execute` call passes a trailing block that calls the association's
  `setInverseInstance(record)` then `setStrictLoading(record)`, in Rails' order.
- A trails test loads a `belongs_to` / `has_one` through the statement-cache path. It asserts
  that the loaded record's inverse is the owner, and that the owner's strict-loading is
  applied to the loaded record, without relying on the later target-assignment path.
- `pnpm parity:api:calls` / `:args` stay green.
